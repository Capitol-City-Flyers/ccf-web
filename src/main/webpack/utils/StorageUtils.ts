export function setJsonItem<T>(storage: Storage, key: string, value: T) {
    storage.setItem(key, JSON.stringify(value));
}

export function getJsonItem<T>(storage: Storage, key: string): null | T {
    const json = storage.getItem(key);
    if (null == json) {
        return null;
    }
    return JSON.parse(json) as T;
}
