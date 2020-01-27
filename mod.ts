import { v4 } from "https://deno.land/std/uuid/mod.ts";

type Resolver = (id: string) => void;

/**
 * A mutex lock for coordination across async functions
 * This is based off of https://github.com/ide/await-lock/blob/master/src/AwaitLock.ts
 */
export default class Mutex {
  private acquired: boolean = false;
  private waitingResolvers: Resolver[] = [];
  private currentLockHolderId: string | null = null;

  /**
   * Acquires the lock, waiting if necessary for it to become free if it is already locked. The
   * returned promise is fulfilled once the lock is acquired.
   *
   * After acquiring the lock, you **must** call `release` when you are done with it.
   */
  acquire(): Promise<string> {
    if (!this.acquired) {
      this.acquired = true;
      this.currentLockHolderId = v4.generate();
      return Promise.resolve(this.currentLockHolderId);
    }

    return new Promise(resolve => {
      this.waitingResolvers.push(resolve);
    });
  }

  /**
   * Releases the lock and gives it to the next waiting acquirer, if there is one. Each acquirer
   * must release the lock exactly once.
   */
  release(id: string): void {
    if (!this.acquired) {
      throw new Error(`Cannot release an unacquired lock`);
    }
    if (id !== this.currentLockHolderId) {
      throw new Error(`Release ID doesn't match current lock ID`);
    }

    if (this.waitingResolvers.length > 0) {
      const resolve = this.waitingResolvers.shift()!;
      this.currentLockHolderId = v4.generate();
      resolve(this.currentLockHolderId);
    } else {
      this.acquired = false;
      this.currentLockHolderId = null;
    }
  }
}
