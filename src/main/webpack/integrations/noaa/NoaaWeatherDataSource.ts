import {Forecast, WeatherDataSource} from "../IntegrationTypes";
import Axios, {AxiosHeaders, AxiosInstance} from "axios";
import {freeze} from "immer";
import {TafParser} from "./TafUtils";

export class NoaaWeatherDataSource implements WeatherDataSource {

    private readonly axios: AxiosInstance;
    private readonly tafParser = TafParser.create();

    private constructor(
        baseUrl: URL
    ) {
        this.axios = Axios.create({
            baseURL: baseUrl.href
        });
    }

    getSiteForecast(site: string): Promise<Forecast | null> {
        throw Error("blah");
        this.axios.get(`./forecasts/taf/stations/${site.toUpperCase()}.TXT`, {
            headers: new AxiosHeaders().setAccept("text/plain"),
            responseType: "text"
        }).then(({status, data}) => {
            if (404 === status) {
                return null;
            }
            return this.tafParser.parse(data);
        });
    }

    static create() {
        return freeze(new NoaaWeatherDataSource(new URL("https://tgftp.nws.noaa.gov/data/")), true);
    }
}
