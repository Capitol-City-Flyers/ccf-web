export interface SyncStatus {
    datasets: Array<DatasetSync>;
}

export interface DatasetSync {
    dataset: string;
    cycle: string;
    segments: Array<string>;
}
