import {AircraftConfig} from "../../config-types";
import {GeoPosition} from "../../navigation/navigation-types";
import {DateTime} from "luxon";

export interface AircraftPosition {
    aircraft: AircraftConfig;
    position: GeoPosition;
    onGround: boolean;
    timestamp: DateTime;
}
