import {AxiosHeaders, AxiosInstance} from "axios";
import {freeze} from "immer";
import _ from "lodash";
import {HTMLParser} from "@capitol-city-flyers/ccf-web-integration";
import {flattenValues} from "../../utilities/array-utils";
import {NWSParser} from "./NWSParser";

/**
 * {@link NWSClient} handles interactions with NOAA/NWS [aviationweather.gov](https://www.aviationweather.gov) and/or
 * other web services for retrieval of weather data, such as Metars and/or TAFs.
 */
export class NWSClient {
    private readonly parser = NWSParser.create();

    private constructor(private readonly axios: AxiosInstance, private readonly htmlParser: HTMLParser) {
    }

    /**
     * Get current Metar and/or TAF data for one or more stations.
     *
     * Note that the input station identifiers need not include the `K` prefix. If it is missing, it will be added. The
     * returned object will map the *original* identifiers passed in the `station` arguments to the corresponding
     * Metars/TAFs. The Metars and/or TAFs themselves will have their station identifiers prefixed with `K`.
     *
     *
     * @param hours number of hours of Metar data to retrieve.
     * @param stations the station identifiers.
     */
    async getMetarsAndTAFs(hours: number, ...stations: (string | string[])[]) {

        /* Normalize station idents to uppercase, add missing "K" prefixes (NWS needs this.) */
        const {axios, htmlParser, parser} = this;
        const [first, ...additional] = stations;
        const originalIdentByNormalizedIdent = Object.fromEntries(flattenValues(first, ...additional)
            .map(station => [_.toUpper(3 === station.length ? `K${station}` : station), station] as const));
        return axios.request<string>({
            method: "get",
            url: "./metar/data",
            headers: new AxiosHeaders().setAccept("text/html").toJSON(),
            params: {
                date: "",
                format: "raw",
                ids: Object.keys(originalIdentByNormalizedIdent).join(" "),
                taf: "on",
                hours
            },
            responseType: "text",
            validateStatus: status => 200 === status
        }).then(({data}) => {

            /* Parse the response; map station idents back to their original values. */
            const response = parser.parseMetarResponse(htmlParser.parse(data));
            return _.assign(response, {
                stations: Object.fromEntries(Object.entries(response.stations)
                    .map(([ident, weather]) =>
                        [originalIdentByNormalizedIdent[ident], weather]))
            });
        });
    }

    static create(axios: AxiosInstance, parser: HTMLParser) {
        return freeze(new NWSClient(axios, parser), true);
    }
}
