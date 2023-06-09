import {AxiosHeaders, AxiosInstance} from "axios";
import {freeze, immerable} from "immer";
import {GeoPosition} from "../../navigation/navigation-types";

/**
 * {@link OpenSkyClient} encapsulates the process of retrieving flight position information from the
 * <a href="https://openskynetwork.github.io/opensky-api/">OpenSky API</a>
 */
export class OpenSkyClient {
    [immerable] = true;

    private constructor(private readonly axios: AxiosInstance) {
    }

    /**
     * Retrieve the current position of an aircraft by 24-bit ICAO identifier ("mode S code"), or `null` if the aircraft
     * is not in flight or flight data is not available.
     *
     * @param modeSCode the aircraft's Mode S code.
     */
    retrievePosition(modeSCode: string): Promise<null | GeoPosition> {
        return this.axios.get<OpenSkyStates>("./states/all", {
            headers: new AxiosHeaders().setAccept("application/json"),
            params: {icao24: modeSCode.toLowerCase()}
        }).then(({data}) => {
            const states = data?.states;
            if (null == states) {
                console.debug(`No flight state available for [${modeSCode}].`, data);
                return null;
            }

            /* Filter out any states that do not include latitude *and* longitude. */
            const positions = states.reverse().filter(state => null != state[5] && null != state[6]),
                position = positions.length > 0 ? positions[0] : null;
            if (null == position) {
                console.debug(`State for [${modeSCode}] contains no position data.`, data);
                return null;
            }
            const timeSecs = position[3],
                time = new Date(timeSecs * 1_000);
            if (time.getTime() < (new Date().getTime() - 600_000)) {
                console.debug(`State for [${modeSCode}] is out of date.`, data);
                return null;
            }
            const ground = position[8];
            if (ground) {
                console.debug(`State for [${modeSCode}] indicates that it is on the ground.`, data);
                return null;
            }
            const latitude = position[6],
                longitude = position[5],
                altitude = position[7],
                track = position[10],
                result = freeze<GeoPosition>({
                    latitude: latitude!,
                    longitude: longitude!,
                    ...(null == altitude ? {} : {altitude}),
                    ...(null == track ? {} : {track})
                });
            console.debug(`Returning position for [${modeSCode}].`, result);
            return result;
        });
    }

    static create(axios: AxiosInstance) {
        return freeze(new OpenSkyClient(axios));
    }
}

/**
 * See the [OpenSky API docs](https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors)
 */
interface OpenSkyStates {
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
        sensors: Array<number>,
        squawk: string | null,
        spi: boolean,
        position_source: number,
        category: number
    ]>;
}
