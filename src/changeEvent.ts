export type ChangeEvent={key: string, value: string | null};
export class ChangeEventTrait {
    constructor(public target:any){}
    private listeners: Set<(e:ChangeEvent) => void> = new Set();    
    addEventListener(type:"change",callback: (e:ChangeEvent) => void): void {
        this.listeners.add(callback);
    }
    removeEventListener(callback: (e:ChangeEvent) => void): void {
        this.listeners.delete(callback);
    }
    notifyListeners(key: string, value: string | null): void {
        this.listeners.forEach(callback => callback.call(this.target,{key, value}));
    }
    bypass(source: ChangeEventTrait): void {
        source.addEventListener("change", (e: ChangeEvent) => {
            this.notifyListeners(e.key, e.value);
        });
    }   
}
    
