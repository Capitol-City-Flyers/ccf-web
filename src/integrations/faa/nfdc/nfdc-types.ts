import {GeoCoordinates} from "../../../navigation/navigation-types";
import {freeze} from "immer";
import {DateTime} from "luxon";

export const NFDC_SEGMENTS = freeze([
    "airports",
    "weatherStations"
] as const);

export type NFDCSegment = typeof NFDC_SEGMENTS[number];

export type NFDCCycle = ReturnType<DateTime["toISODate"]>;

export interface WeatherStation {
    key: string; /* cycle.ident */
    cityName: string;
    coordinates: GeoCoordinates;
    ident: string;
    stateCode: string;
    type:
        | "asos"
        | "awos-1"
        | "awos-2"
        | "awos-3"
        | "awos-3p"
        | "awos-3pt"
        | "awos-3t"
        | "awos-4"
        | "awos-a"
        | "awos-av";
}

export interface Airport {
    key: string; /* cycle.ident */
    cityName: string;
    coordinates: GeoCoordinates;
    countryCode: string;
    elevation: number;
    icaoIdent?: string;
    ident: string;
    name: string;
    ownership: "public" | "private";
    stateCode: string;
    stateName: string;
}
