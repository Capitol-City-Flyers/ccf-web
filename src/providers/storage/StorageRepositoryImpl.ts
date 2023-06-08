import {freeze} from "immer";
import {WeightedItemGraph} from "../../utilities/WeightedItemGraph";
import type {ItemMigration, StorageRepository} from "./storage-types";

export class StorageRepositoryImpl<TItem> implements StorageRepository<TItem> {
    private readonly migrations: WeightedItemGraph<string, ItemMigration>;

    constructor(private backend: Storage, private format: string, migrations: Array<ItemMigration>) {
        this.migrations = WeightedItemGraph.create<string, ItemMigration>(migrations.map(migration => ({
            item: migration,
            vertices: migration.formats,
            weight: 1
        })));
    }

    exists(key: string): boolean {
        return null != this.backend.getItem(key);
    }

    getItem(key: string): TItem | null {
        const item = this.backend.getItem(key);
        if (null == item) {
            return null;
        }
        return this.migrate(JSON.parse(item) as StorageItem);
    }

    removeItem(key) {
        this.backend.removeItem(key);
    }

    setItem(key: string, item: TItem) {
        this.backend.setItem(key, JSON.stringify({
            format: this.format,
            item
        }));
        return item;
    }

    private migrate(item: StorageItem): TItem {
        let result: TItem;
        const {format} = this,
            itemFormat = item.format;
        if (itemFormat === format) {
            result = item.item;
        } else {
            const {migrations} = this;
            result = this.migrations.span(itemFormat, format)
                .reduce((acc, migration) => {
                    const {migrate, formats: [from, to]} = migration;
                    console.debug(`Migrating item from format [${itemFormat}] to [${format}].`);
                    return migration.migrate(acc)
                }, item.item);
        }
        return result;
    }

    static create<TItem>(backend: Storage, format: string, migrations?: Array<ItemMigration>): StorageRepository<TItem> {
        return freeze(new StorageRepositoryImpl(backend, format, migrations || []));
    }
}

interface StorageItem {
    format: string;
    item: any;
}
