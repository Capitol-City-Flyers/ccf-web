import _ from "lodash";
import {Interval} from "luxon";

export interface SyncStatus {
    datasets: Array<DatasetStatus>;
}

type DatasetStatus =
    | PeriodicDatasetStatus;

interface PeriodicDatasetStatus {
    kind: "periodicDatasetSync";
    dataset: string;
    cycles: {
        [cycle in string]: {
            interval: ReturnType<Interval["toISO"]>;
            segments: Array<string>;
        }
    }
}

export function isPeriodicDatasetStatus(value: any): value is PeriodicDatasetStatus {
    return _.isObject(value)
        && "kind" in value
        && "periodicDatasetSync" === value.kind;
}
