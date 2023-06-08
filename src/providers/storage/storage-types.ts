
export interface StorageRepository<TItem> {
    exists(key: string): boolean;
    getItem(key: string): TItem | null;
    removeItem(key: string);
    setItem(key: string, item: TItem): TItem;
}

export interface ItemMigration {
    formats: [from: string, to: string];

    migrate(item: any): any;
}
