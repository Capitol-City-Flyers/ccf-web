import {IntegrationConfig} from "../../config-types";
import {TailNumber} from "../../aircraft/aircraft-types";
import {GeoCoordinates} from "../../navigation/navigation-types";

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

export interface WeatherStation {
    cityName: string;
    ident: string;
    location: GeoCoordinates;
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

export interface WeatherStationSync extends Sync<"weatherStations"> {
    source:
        | "faaNasr";
    cycle: string; /* e.g. 18_May_2023 */
}

export interface ReservationSync extends Sync<"reservations"> {

}
