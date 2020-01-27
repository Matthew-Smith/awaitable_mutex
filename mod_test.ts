import {
  assert,
  assertEquals,
  assertThrows
} from "https://deno.land/std/testing/asserts.ts";
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
});

test({
  name: `throws if mutex id doesn't match current mutex holder`,
  fn: async (): Promise<void> => {
    const mutex = new Mutex();
    const id = await mutex.acquire();
    assertThrows(() => mutex.release(`abc123`));
    mutex.release(id);
  }
});

test(`blocks async code that has not acquired the mutex`, async () => {
  let mutex = new Mutex();

  let semaphore = 1;
  const testSemaphore = async () => {
    const mutexId = await mutex.acquire();
    assertEquals(semaphore, 1);

    semaphore--;
    await Promise.resolve();
    assertEquals(semaphore, 0);

    semaphore++;
    mutex.release(mutexId);
  };

  await Promise.all([testSemaphore(), testSemaphore()]);
});

test(`blocks data object access while fetching data to modify the data object`, async () => {
  const mutex = new Mutex();
  let data: any = {
    url: `https://gist.githubusercontent.com/Matthew-Smith/c7f35894ccbdd7dca587a276606e2639/raw/00c4c9d8601bd261be06f489a1548bbf4fc8316e/deno_async_fetch_test.json`
  };

  const getDataStore = async () => {
    const mutexId = await mutex.acquire();
    return { mutexId, dataStore: data };
  };
  const setDataStore = ({
    mutexId,
    dataStore
  }: {
    mutexId: string;
    dataStore: any;
  }) => {
    data = dataStore;
    mutex.release(mutexId);
  };

  let order = 0;

  const first = async () => {
    assertEquals(order, 0);
    order++;

    const data = await getDataStore();
    assert(!data.dataStore.fetchedData); // assert that the doesn't exist

    const result = await fetch(data.dataStore.url);
    // assert that this next bit happens after the `second` function requests the data store
    assertEquals(order, 2);
    order++;

    setDataStore({
      mutexId: data.mutexId,
      dataStore: {
        ...data.dataStore,
        fetchedData: await result.json()
      }
    });
  };
  const second = async () => {
    assertEquals(order, 1); //
    order++;
    const data = await getDataStore();

    // assert that this next bit happens after the `first` function releases the data store
    assertEquals(order, 3);
    order++;

    assert(!!data.dataStore.fetchedData); // assert that the data was fetched
    setDataStore(data);
  };

  first();
  second();
});
