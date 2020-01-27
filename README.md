# awaitable_mutex
Deno library for blocking execution of a section of code to one at a time

# Usage
```TypeScript
import Mutex from "https://deno.land/x/awaitable_mtuex/mod.ts"

const mutex = new Mutex();

const testFn = async () => {
  const acquisitionId = await mutex.acquire();
  // Do some data manipulation that only one process can access at a time
  mutex.release(acquisitionId);
};
```

# Testing
```Bash
deno test --allow-env --allow-write --allow-net mod_test.ts
```
