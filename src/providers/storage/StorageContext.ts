import {createContext, useContext, useMemo} from "react";
import type {ItemMigration, StorageRepository} from "./storage-types";

export interface StorageContext {
    createRepository<TItem>(format: string, migrations: Array<ItemMigration>): StorageRepository<TItem>;
}

export const storageContext = createContext<StorageContext | null>(null);

export function useStorage<TItem>(format: string, migrations?: Array<ItemMigration>) {
    const context = useContext(storageContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return useMemo(() => context!.createRepository<TItem>(format, migrations || []), [format, migrations]);
}
