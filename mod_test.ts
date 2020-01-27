import { assert, assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

import Mutex from "./mod.ts";

test({
  name: `can be acquired asynchronously and released`,
  fn: async (): Promise<void> => {
    const mutex = new Mutex();
    const id = await mutex.acquire();
    mutex.release(id);
  }
});

test({
  name: `aquired mutex returns a valid UUID identifier`,
  fn: async (): Promise<void> => {
    const mutex = new Mutex();
    const id = await mutex.acquire();
    assert(v4.validate(id));
    mutex.release(id);
  }
});

test({
  name: `throws if released while unacquired`,
  fn: async (): Promise<void> => {
    const mutex = new Mutex();
    assertThrows(() => mutex.release(``));
  }
})

test({
  name: `throws if mutex id doesn't match current mutex holder`,
  fn: async (): Promise<void> => {
    const mutex = new Mutex();
    const id = await mutex.acquire();
    assertThrows(() => mutex.release(`abc123`));
    mutex.release(id);
  }
})

test(`blocks async code that has not acquired the mutex`, async () => {
  let mutex = new Mutex();

  let semaphore = 1;
  async function testSemaphore() {
    const mutexId = await mutex.acquire();
    assertEquals(semaphore, 1);

    semaphore--;
    await Promise.resolve();
    assertEquals(semaphore, 0);

    semaphore++;
    mutex.release(mutexId);
  }

  await Promise.all([testSemaphore(), testSemaphore()]);
});
