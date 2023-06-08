import {freeze} from "immer";
import JSZip from "jszip";
import _ from "lodash";
import Papa, {ParseConfig} from "papaparse";
import type {WeatherStation} from "../../../providers/database/database-types";
import type {Airport} from "./nfdc-types";

export class NFDCParser {

    private constructor() {
    }

    async parseAirports(csv: JSZip.JSZipObject) {
        return this.parseCSV<Airport>(csv, record => ({
            cityName: record["CITY"],
            location: {
                latitude: record["LAT_DECIMAL"],
                longitude: record["LONG_DECIMAL"]
            },
            countryCode: record["COUNTRY_CODE"],
            elevation: record["ELEV"],
            ...(!record["ICAO_ID"] ? {} : {icaoIdent: record["ICAO_ID"]}),
            ident: record["ARPT_ID"],
            name: record["ARPT_NAME"],
            ownership: "PU" === record["OWNERSHIP_TYPE_CODE"] ? "public" : "private",
            stateCode: record["STATE_CODE"],
            stateName: record["STATE_NAME"]
        }));
    }

    async parseWeatherStations(csv: JSZip.JSZipObject) {
        return this.parseCSV<WeatherStation>(csv, record => ({
            cityName: record["CITY"],
            location: {
                latitude: record["LAT_DECIMAL"],
                longitude: record["LONG_DECIMAL"]
            },
            countryCode: record["COUNTRY_CODE"],
            ident: record["ASOS_AWOS_ID"],
            stateCode: record["STATE_CODE"],
            type: _.lowerCase(record["ASOS_AWOS_TYPE"]) as WeatherStation["type"]
        }));
    }

    private async parseCSV<TOutput>(csv: JSZip.JSZipObject, parser: RecordParser<TOutput>): Promise<Array<TOutput>> {
        const text = await csv.async("text"),
            {data} = await Papa.parse<Record<string, any>>(text, {
                ...(NFDCParser.CSV_PARSE_OPTIONS)
            });
        return data.map(parser);
    }

    static create() {
        return freeze(new NFDCParser(), true);
    }

    private static CSV_PARSE_OPTIONS = freeze<ParseConfig<Record<string, any>>>({
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
    });
}

type RecordParser<TOutput> = (record: Record<string, any>) => TOutput;
