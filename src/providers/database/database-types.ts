import {IntegrationConfig} from "../../config-types";
import {TailNumber} from "../../aircraft/aircraft-types";

export interface Sync<TKind extends string> {
    kind: TKind;
    dateTime: string;
}

export interface Reservation {
    id?: number;
    kind: "aircraft";
    dateTimeRange: string;
    tailNumber: TailNumber;
    ref: Partial<{ [K in keyof IntegrationConfig]: string; }>;
}
