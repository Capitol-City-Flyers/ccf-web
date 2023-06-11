import {freeze} from "immer";
import jszip from "jszip";
import {DateTime} from "luxon";
import {cycleInterval} from "../../../utilities/date-utils";
import {NFDCParser} from "./NFDCParser";
import type {AxiosInstance} from "axios";
import type {Airport, WeatherStation} from "./nfdc-types";

export class NFDCClient {
    private readonly parser: NFDCParser;

    private constructor(private readonly axios: AxiosInstance) {
        this.parser = NFDCParser.create();
    }

    currentCycle(reference: DateTime) {
        return cycleInterval(NFDCClient.NASR_CYCLE_BASE, 28, reference, 0);
    }

    async getAirports(cycle: ReturnType<DateTime["toISODate"]>): Promise<Array<Airport>> {
        const {data} = await this.getCycleFile(cycle, "APT_CSV.zip"),
            zip = await jszip.loadAsync(data);
        return this.parser.parseAirports(cycle, zip.file("APT_BASE.csv"));
    }

    async getWeatherStations(cycle: ReturnType<DateTime["toISODate"]>): Promise<Array<WeatherStation>> {
        const response = await this.getCycleFile(cycle,"AWOS_CSV.zip"),
            zip = await jszip.loadAsync(response.data);
        return this.parser.parseWeatherStations(cycle, zip.file("AWOS.csv"));
    }

    private getCycleFile(cycle: ReturnType<DateTime["toISODate"]>, suffix: string, offset: number = 0) {
        const start = DateTime.fromISO(cycle),
            filename = `${start.toFormat("dd_MMM_yyyy")}_${suffix}`;
        return this.axios.get<ArrayBuffer>(`./webContent/28DaySub/extra/${filename}`);
    }

    private cyclePrefix(reference: DateTime, offset: number = 0) {
        const {start} = cycleInterval(NFDCClient.NASR_CYCLE_BASE, 28, reference, offset);
        return start.toFormat("dd_MMM_yyyy");
    }

    static create(axios: AxiosInstance) {
        return freeze(new NFDCClient(axios), true);
    }

    private static NASR_CYCLE_BASE = DateTime.fromISO("2023-05-18T00:00:00", {zone: "UTC"});
}