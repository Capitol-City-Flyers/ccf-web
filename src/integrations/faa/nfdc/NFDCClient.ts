import {freeze} from "immer";
import jszip from "jszip";
import {DateTime} from "luxon";
import {cycleInterval} from "../../../utilities/date-utils";
import {DateCalc} from "../../../utilities/DateCalc";
import {NFDCParser} from "./NFDCParser";
import type {AxiosInstance} from "axios";
import type {WeatherStation} from "../../../providers/database/database-types";
import type {Airport} from "./nfdc-types";

export class NFDCClient {
    private readonly parser: NFDCParser;

    private constructor(private readonly axios: AxiosInstance, private readonly dates: DateCalc) {
        this.parser = NFDCParser.create();
    }

    async getAirports(): Promise<Array<Airport>> {
        const {data} = await this.getCycleFile("APT_CSV.zip"),
            zip = await jszip.loadAsync(data);
        return this.parser.parseAirports(zip.file("APT_BASE.csv"));
    }

    async getWeatherStations(): Promise<Array<WeatherStation>> {
        const response = await this.getCycleFile("AWOS_CSV.zip"),
            zip = await jszip.loadAsync(response.data);
        return this.parser.parseWeatherStations(zip.file("AWOS.csv"));
    }

    private getCycleFile(suffix: string, offset: number = 0) {
        const reference = this.dates.nowUTC(),
            {start} = cycleInterval(NFDCClient.NASR_CYCLE_BASE, 28, reference, offset),
            filename = `${start.toFormat("dd_MMM_yyyy")}_${suffix}`;
        return this.axios.get<ArrayBuffer>(`./webContent/28DaySub/extra/${filename}`);
    }

    private cyclePrefix(reference: DateTime, offset: number = 0) {
        const {start} = cycleInterval(NFDCClient.NASR_CYCLE_BASE, 28, reference, offset);
        return start.toFormat("dd_MMM_yyyy");
    }

    static create(axios: AxiosInstance, dates: DateCalc) {
        return freeze(new NFDCClient(axios, dates), true);
    }

    private static NASR_CYCLE_BASE = DateTime.fromISO("2023-05-18T00:00:00", {zone: "UTC"});
}