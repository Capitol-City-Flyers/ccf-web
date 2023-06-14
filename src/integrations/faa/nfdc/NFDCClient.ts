import type {AxiosInstance} from "axios";
import {freeze} from "immer";
import jszip from "jszip";
import {DateTime, Interval} from "luxon";
import type {Airport, WeatherStation} from "./nfdc-types";
import {NFDCParser} from "./NFDCParser";

export class NFDCClient {
    private readonly parser: NFDCParser;

    private constructor(private readonly axios: AxiosInstance) {
        this.parser = NFDCParser.create();
    }

    async getAirports(cycle: Interval): Promise<Array<Airport>> {
        const {data} = await this.getCycleFile(cycle, "APT_CSV.zip"),
            zip = await jszip.loadAsync(data);
        return this.parser.parseAirports(zip.file("APT_BASE.csv"));
    }

    async getWeatherStations(cycle: Interval): Promise<Array<WeatherStation>> {
        const response = await this.getCycleFile(cycle,"AWOS_CSV.zip"),
            zip = await jszip.loadAsync(response.data);
        return this.parser.parseWeatherStations(zip.file("AWOS.csv"));
    }

    private getCycleFile(cycle: Interval, suffix: string) {
        const start = cycle.start.setZone("UTC"),
            filename = `${start.toFormat("dd_MMM_yyyy")}_${suffix}`;
        return this.axios.get<ArrayBuffer>(`./webContent/28DaySub/extra/${filename}`);
    }

    static create(axios: AxiosInstance) {
        return freeze(new NFDCClient(axios), true);
    }

    private static NASR_CYCLE_BASE = DateTime.fromISO("2023-05-18T00:00:00", {zone: "UTC"});
}