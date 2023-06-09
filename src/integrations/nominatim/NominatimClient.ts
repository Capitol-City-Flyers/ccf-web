import {AxiosInstance} from "axios";
import {freeze, immerable} from "immer";
import _ from "lodash";
import {throttleAsync} from "../../utilities/function-utils";
import {GeoCoordinates} from "../../navigation/navigation-types";
import {ReverseGeoProvider} from "./nominatim-types";

/**
 * {@link NominatimClient} encapsulates the process of retrieving a place name from a pair of geographic coordinates
 * using the <a href="https://nominatim.org/release-docs/develop/api/Overview/">Nominatim API</a>.
 */
export class NominatimClient implements ReverseGeoProvider {
    [immerable] = true;

    private readonly throttledAxiosGet: AxiosInstance["get"];

    private constructor(axios: AxiosInstance) {
        this.throttledAxiosGet = throttleAsync(_.bind(axios.get, axios), 5_000);
    }

    retrievePlace(coords: GeoCoordinates): Promise<null | string> {
        const {latitude, longitude} = coords;

        /* Note: throttle Nominatim API requests to 1 per 5sec, they ask nicely. */
        return this.throttledAxiosGet<NominatimResponse>("./reverse", {
            params: {
                lat: latitude,
                lon: longitude,
                zoom: 10
            }
        }).then(({data}) => {
            if (isError(data)) {
                const {error} = data;
                console.debug(`Failed to retrieve name for [${latitude}, ${longitude}] because an error occurred: [${error}].`, data);
                return null;
            }
            const {address} = data;
            return this.toPlaceName(address);
        });
    }

    private toPlaceName(address: NominatimPlace["address"]) {
        const {country_code} = address,
            segments: Array<undefined | string> = [this.municipalityName(address)];
        if ("us" !== country_code && "ca" !== country_code) {
            const {county} = address;
            segments.push(county);
        }
        segments.push(this.stateAbbrOrName(address));
        const name = segments.filter(segment => null != segment).join(", ");
        console.debug(`Returning place name [${name}].`, address);
        return name;
    }

    private municipalityName(address: NominatimPlace["address"]) {
        const {city, county, hamlet, municipality, town, village} = address,
            municipalityName = city || town || village || municipality || hamlet || county;
        if (null != municipalityName) {
            const prefix = MUNICIPALITY_PREFIXES.find(prefix => municipalityName.startsWith(prefix));
            if (null == prefix) {
                return municipalityName.trim();
            }
            return municipalityName.substring(prefix.length).trim();
        }
    }

    private stateAbbrOrName(address: NominatimPlace["address"]) {
        const {["ISO3166-2-lvl4"]: isoState} = address;
        if (null != isoState) {
            return isoState.split("-").pop();
        }
        const {state} = address;
        if (null != state) {
            return state;
        }
    }

    static create(axios: AxiosInstance) {
        return freeze(new NominatimClient(axios));
    }
}

/**
 * Error response from a Nominatim API, comes back as a `200 OK`.
 */
interface NominatimError {

    /**
     * Error message.
     */
    error: string;
}

/**
 * Significant items from a reverse geocode query for a place.
 */
interface NominatimPlace {
    place_id: string;
    licence: string;
    display_name: string;
    address: {
        city?: string;
        county: string;
        hamlet?: string;
        municipality?: string;
        state: string;
        town?: string;
        village?: string;
        "ISO3166-2-lvl4": string;
        country: string;
        country_code: string;
    }
}

/**
 * Nominatim API response contents.
 */
type NominatimResponse =
    | NominatimError
    | NominatimPlace;

/**
 * Type guard to determine whether a Nominatim API response indicates that an error occurred.
 *
 * @param value the value to check.
 */
function isError(value: any): value is NominatimError {
    return "object" === typeof value
        && "error" in value
        && "string" === typeof value.error;
}

/**
 * Prefixes to strip from municipality names in the interest of brevity.
 */
const MUNICIPALITY_PREFIXES = freeze([
    "Town of ",
    "City of ",
    "Village of "
]);
