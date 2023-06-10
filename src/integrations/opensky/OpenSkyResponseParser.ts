import _ from "lodash";
import {AircraftPosition} from "./opensky-types";
import {AircraftConfig} from "../../config-types";
import {DateTime} from "luxon";
import {freeze} from "immer";

/**
 * {@link OpenSkyResponseParser} parses OpenSky API responses into generic flight tracking data types.
 */
export class OpenSkyResponseParser {
    private constructor() {
    }

    parseStatesAllResponse(response: StatesAllResponse, aircraft: Array<AircraftConfig>) {
        const aircraftByModeSCodeHexLowercase = _.keyBy(aircraft, ({modeSCodeHex}) => _.toLower(modeSCodeHex));
        return freeze<Array<AircraftPosition>>(_.map(response.states, state => {
            const [
                    modeSCodeHex,
                    tailNumber,
                    origin_country,
                    time_position,
                    last_contact,
                    longitude,
                    latitude,
                    baro_altitude,
                    on_ground,
                    velocity,
                    true_track,
                    vertical_rate
                ] = state,
                aircraft = aircraftByModeSCodeHexLowercase[modeSCodeHex];
            return {
                position: {
                    altitude: Math.round(3.28084 * baro_altitude),
                    ...(null == true_track ? {} : {heading: true_track}),
                    latitude, longitude,
                },
                onGround: on_ground,
                timestamp: DateTime.fromMillis(time_position * 1_000, {zone: "UTC"}),
                aircraft
            }
        }), true);
    }

    static create() {
        return freeze(new OpenSkyResponseParser(), true);
    }
}

/**
 * See the [OpenSky API docs](https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors)
 */
export interface StatesAllResponse {
    time: number;
    states: Array<[
        icao24: Lowercase<string>,
        callsign: string, /* must be trimmed. */
        origin_country: string,
        time_position: number,
        last_contact: number,
        longitude: number,
        latitude: number,
        baro_altitude: number,
        on_ground: boolean,
        velocity: number,
        true_track: number,
        vertical_rate: number,
        sensors: Array<number> | null,
        geo_altitude: number,
        squawk: string | null,
        spi: boolean,
        position_source: number
    ]>;
}
