import Axios, {AxiosHeaders, AxiosInstance} from "axios";
import {freeze, immerable} from "immer";
import {FlightInfoProvider, GeoPosition} from "../../types/FlightsTypes";

/**
 * {@link OpenSkyClient} encapsulates the process of retrieving flight position information from the
 * <a href="https://openskynetwork.github.io/opensky-api/">OpenSky API</a>
 */
export class OpenSkyClient implements FlightInfoProvider {
    [immerable] = true;

    private readonly axios: AxiosInstance;

    private constructor(
        /**
         * Base URL of the OpenSky API.
         */
        baseUrl: URL = new URL("https://opensky-network.org/api/")
    ) {
        this.axios = Axios.create({
            baseURL: baseUrl.href,
            validateStatus: status => -1 !== [200, 404].indexOf(status)
        });
    }

    /**
     * Retrieve the current position of an aircraft by 24-bit ICAO identifier ("mode S code"), or `null` if the aircraft
     * is not in flight or flight data is not available.
     *
     * @param modeSCode the aircraft's Mode S code.
     */
    retrievePosition(modeSCode: string): Promise<null | GeoPosition> {
        return this.axios.get("./tracks/all", {
            headers: new AxiosHeaders().setAccept("application/json"),
            params: {icao24: modeSCode.toLowerCase()},
            responseType: "text",
            validateStatus: status => -1 !== [200, 404, 500].indexOf(status)
        }).then(({data, status}) => {
            if (404 === status) {
                console.debug(`No track available for [${modeSCode}].`);
                return null;
            } else if (500 === status) {
                console.error(`Error retrieving track for [${modeSCode}]: ${data}`);
                return null;
            }
            const {path} = JSON.parse(data) as OpenSkyTrack,
                positions = path.reverse().filter(([, latitude, longitude]) =>
                    null != latitude && null != longitude),
                position = positions.length > 0 ? positions[0] : null;
            if (null == position) {
                console.debug(`Track for [${modeSCode}] contains no position data.`, data);
                return null;
            }
            const [timeSecs] = position,
                time = new Date(timeSecs * 1_000);
            if (time.getTime() < (new Date().getTime() - 600_000)) {
                console.debug(`Track for [${modeSCode}] is out of date.`, data);
                return null;
            }
            const [, latitude, longitude, altitude, track, ground] = position;
            if (ground) {
                console.debug(`Track for [${modeSCode}] indicates that it is on the ground.`, data);
                return null;
            }
            const result = freeze<GeoPosition>({
                latitude: latitude!,
                longitude: longitude!,
                ...(null == altitude ? {} : {altitude}),
                ...(null == track ? {} : {track})
            });
            console.debug(`Returning position for [${modeSCode}].`, result);
            return result;
        });
    }

    static create(baseUrl?: URL): FlightInfoProvider {
        return freeze(new OpenSkyClient(baseUrl));
    }
}

/**
 * Raw format of an aircraft track record received from the OpenSky API.
 */
interface OpenSkyTrack {
    callsign: string;
    endTime: number;
    startTime: number;
    path: Array<[
        time: number,
        latitude: null | number,
        longitude: null | number,
        baro_altitude: null | number,
        true_track: null | number,
        on_ground: boolean
    ]>;
}

