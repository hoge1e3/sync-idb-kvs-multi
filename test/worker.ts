import { MultiSyncIDBStorage } from 'sync-idb-kvs-multi';
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const storage = await MultiSyncIDBStorage.create();
const theValue=storage.getItem("key");
console.log("worker-theValue",theValue);
storage.setItem("key",theValue+"!");
await sleep(1000);
storage.removeItem("key");