import { IStorage, SyncIDBStorage } from "sync-idb-kvs";
import { ChangeEvent, ChangeEventTrait } from "./changeEvent.js";
//import {BroadcastChannel} from "worker_threads";
export type BroadCastEvent=MessageEvent;
export class MultiSyncIDBStorage implements IStorage {
    private storage: SyncIDBStorage;
    //TS2749: 'BroadcastChannel' refers to a value, but is being used as a type here. Did you mean 'typeof BroadcastChannel'?
    private channel: BroadcastChannel;
    channelName:string;
    changeEventTrait=new ChangeEventTrait(this);
    // Only receives updates from other workers
    addEventListener(type: "change", callback: (e: ChangeEvent) => void): void {
        this.changeEventTrait.addEventListener(type, callback);
    }
    removeEventListener(callback: (e: ChangeEvent) => void): void {
        this.changeEventTrait.removeEventListener(callback);
    }
    static async create(dbName = "SyncStorageDB", storeName = "kvStore"): Promise<MultiSyncIDBStorage> {
        const s=await SyncIDBStorage.create(dbName, storeName);
        return new MultiSyncIDBStorage(s);
    }
    async waitForCommit(){
        return await this.storage.waitForCommit();
    }
    constructor(storage: SyncIDBStorage) {
        this.storage = storage;
        this.channelName=storage.channelName;//dbName+"/"+storage.storeName;
        this.channel = new BroadcastChannel(this.channelName);

        // 他のワーカーからの更新通知を受け取る
        this.channel.onmessage = async (event:BroadCastEvent) => {
            const { type, key, value } = event.data;
            if (type === "set") {
                this.storage.memoryCache[key] = value;
                this.changeEventTrait.notifyListeners(key, value);
            } else if (type === "remove") {
                delete this.storage.memoryCache[key];
                this.changeEventTrait.notifyListeners(key, null);
            }
        };
    }

    getItem(key: string): string | null {
        return this.storage.getItem(key);
    }

    setItem(key: string, value: string): void {
        this.storage.setItem(key, value);
        //console.log("Send idb message set", key,value);

        // 他のワーカーに変更を通知
        this.channel.postMessage({ type: "set", key, value });
        //this.changeEventTrait.notifyListeners(key, value); bypassed
    }

    removeItem(key: string): void {
        this.storage.removeItem(key);
        // 他のワーカーに削除を通知
        //console.log("Send idb message remove", key);
        this.channel.postMessage({ type: "remove", key });
        //this.changeEventTrait.notifyListeners(key, null); bypassed
    }

    itemExists(key: string): boolean {
        return this.storage.itemExists(key);
    }

    keys(): IterableIterator<string> {
        return this.storage.keys();
    }

    async reload(key: string): Promise<string | null> {
        return this.storage.reload(key);
    }

}
