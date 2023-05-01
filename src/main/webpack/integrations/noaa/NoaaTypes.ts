import {DateTime} from "luxon";

/**
 * Entry extracted from a METAR or TAF cycle file.
 */
export interface CycleEntry {
    content: Array<string>;
    revised?: "amendment" | "correction";
    timestamp: DateTime;
}
