import {GeoCoordinates} from "../../../navigation/navigation-types";
import {freeze} from "immer";
import {DateTime} from "luxon";

export const NASR_SEGMENTS = freeze([
    "airports",
    "weatherStations"
] as const);

export type NASRSegment = typeof NASR_SEGMENTS[number];

export type NASRCycle = ReturnType<DateTime["toISODate"]>;

export interface WeatherStation {
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
