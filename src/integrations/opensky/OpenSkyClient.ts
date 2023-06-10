import {type AxiosInstance} from "axios";
import {freeze, immerable} from "immer";
import _ from "lodash";
import {type AircraftConfig} from "../../config-types";
import {OpenSkyResponseParser, StatesAllResponse} from "./OpenSkyResponseParser";
import {AircraftPosition} from "./opensky-types";

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
    async queryPositions(aircraft: Array<AircraftConfig>): Promise<Array<AircraftPosition>> {
        if (0 === aircraft.length) {
            return Promise.resolve([]);
        }
        return this.axios.get<StatesAllResponse>("./states/all", {
            params: {
                icao24: _.map(aircraft, ({modeSCodeHex}) => _.toLower(modeSCodeHex))
            }
        }).then(({data}) => this.parser.parseStatesAllResponse(data, aircraft));
    }

    static create(axios: AxiosInstance) {
        return freeze(new OpenSkyClient(axios));
    }
}
