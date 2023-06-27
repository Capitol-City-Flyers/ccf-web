import {DateTime} from "luxon";

/**
 * Parsed `./metar/data` response.
 */
export interface MetarResponse {
    stations: {
        [Station in string]: {
            metars: string[];
            taf?: string[];
        }
    }
    timestamp: DateTime;
}
