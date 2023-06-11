import {DateTime} from "luxon";
import type {GeoPosition} from "../../navigation/navigation-types";
import type {AircraftIdent} from "../../aircraft/aircraft-types";

export interface AircraftPosition {
    aircraft: AircraftIdent;
    position: GeoPosition;
    onGround: boolean;
    timestamp: DateTime;
    place?: string;
}
