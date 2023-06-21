import {type AxiosInstance, isAxiosError} from "axios";
import {freeze, immerable} from "immer";
import _ from "lodash";
import {OpenSkyResponseParser, type StatesAllResponse} from "./OpenSkyResponseParser";
import type {AircraftIdent} from "../../aircraft/aircraft-types";
import type {AircraftPosition} from "./opensky-types";
import {validateIn} from "../../utilities/array-utils";
import {DateTime} from "luxon";

/**
 * {@link OpenSkyClient} encapsulates the process of retrieving flight position information from the
 * <a href="https://openskynetwork.github.io/opensky-api/">OpenSky API</a>
 */
export class OpenSkyClient {
    [immerable] = true;

    private readonly parser: OpenSkyResponseParser;

    private constructor(private readonly axios: AxiosInstance) {
        this.parser = OpenSkyResponseParser.create();
    }

    /**
     * Query OpenSky for the positions of zero or more aircraft. Returns the most recent position information for each
     * aircraft for which position information is available; aircraft for which position information is *not* available
     * will not be present in the returned array.
     *
     * @param aircraft the aircraft to query.
     */
    async queryPositions(aircraft: Array<AircraftIdent>): Promise<Array<AircraftPosition>> {
        if (0 === aircraft.length) {
            return Promise.resolve([]);
        }
        const response = await this.axios<StatesAllResponse>({
            method: "get",
            url: "./states/all",
            params: {
                icao24: _.map(aircraft, ({modeSCodeHex}) => _.toLower(modeSCodeHex))
            },
            timeout: 5_000,
            validateStatus: validateIn(200)
        });
        if (!isAxiosError(response)) {
            return this.parser.parseStatesAllResponse(response.data, aircraft);
        }
        console.warn("Error querying aircraft positions.", response);
        return [];
    }

    static create(axios: AxiosInstance) {
        return freeze(new OpenSkyClient(axios));
    }
}
