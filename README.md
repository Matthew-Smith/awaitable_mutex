# awaitable_mutex
Deno library for blocking execution of a section of code to one at a time

This module was made to block access to a data store while something else in the event loop was modifying it.


# Usage
Simply `acquire` and `release` the mutex when needed
```TypeScript
import Mutex from "https://deno.land/x/awaitable_mutex/mod.ts"

const mutex = new Mutex();

const testFn = async () => {
  const acquisitionId = await mutex.acquire();
  // Do some data manipulation that only one process can access at a time
  mutex.release(acquisitionId);
};
```

See more complicated examples in [mod_test.ts](./mod_test.ts). Specifically `blocks data object access while fetching data to modify the data object` is probably most useful.


# Testing
```Bash
deno test --allow-env --allow-write --allow-net mod_test.ts
```
