import _ from "lodash";
import {DateTime} from "luxon";
import type {AircraftIdent, TailNumber} from "../../aircraft/aircraft-types";
import type {GeoPosition} from "../../navigation/navigation-types";

/**
 * Information on a single flight.
 */
export interface Flight {
    aircraft: AircraftIdent;
    position: GeoPosition;
    place?: string;
}

/**
 * Flight tracking state.
 */
export interface FlightsState {
    aircraftByTailNumber: {
        [T in TailNumber]: AircraftIdent;
    };
    flights: Array<AircraftFlightStatus>;
}

/**
 * Status of a single aircraft, which may or may not be in flight.
 */
export interface AircraftFlightStatus {
    tailNumber: TailNumber;
    status:
        | "undetermined"
        | "notInFlight"
        | InFlight;
    updated: DateTime;
}

/**
 * Status of a flight.
 */
export interface InFlight {
    kind: "inFlight";
    place?: string;
    position: GeoPosition;
}

/**
 * Type guard for {@link InFlight}.
 *
 * @param value the value to check.
 */
export function isInFlight(value: any): value is InFlight {
    return _.isObject(value)
        && "kind" in value
        && "inFlight" === value.kind;
}
