import {GeoCoordinates} from "../../../navigation/navigation-types";

export interface AirportSummary {
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

export interface AWOSSummary {
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
    location: GeoCoordinates;
    countryCode: string;
    elevation: number;
    icaoIdent?: string;
    ident: string;
    name: string;
    ownership: "public" | "private";
    stateCode: string;
    stateName: string;
}
