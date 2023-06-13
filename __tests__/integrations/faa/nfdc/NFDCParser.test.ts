import {readResources} from "../../../test-data-utils";
import jszip from "jszip";
import _ from "lodash";
import {NFDCParser} from "../../../../src/integrations/faa/nfdc/NFDCParser";

describe("NFDCParser", () => {
    const instance = NFDCParser.create();
    test("parseAirports()", async () => {
        const [[, source]] = await readResources("./integrations/faa/nfdc/18_May_2023_CSV.zip"),
            zip = await jszip.loadAsync(source),
            airports = _.sortBy(await instance.parseAirports(zip.file("APT_BASE.csv")), "ident"),
            madison = airports.filter(a => "MSN" === a.ident)[0]!,
            moriarty = airports.filter(a => "0E0" === a.ident)[0]!;
        expect(madison).toStrictEqual({
            cityName: 'MADISON',
            coordinates: {
                latitude: 43.13987913,
                longitude: -89.33750447
            },
            countryCode: "US",
            elevation: 886.6,
            icaoIdent: "KMSN",
            ident: "MSN",
            name: "DANE COUNTY RGNL/TRUAX FLD",
            ownership: "public",
            stateCode: "WI",
            stateName: "WISCONSIN"
        });

        /* By default, PapaParse interprets "0E0" as a number (0.0e0); verify that the parser config avoids this. */
        expect(moriarty).toStrictEqual({
            cityName: "MORIARTY",
            coordinates: {
                "latitude": 34.97816666,
                "longitude": -106.00002777,
            },
            countryCode: "US",
            elevation: 6204.2,
            ident: "0E0",
            name: "MORIARTY MUNI",
            ownership: "public",
            stateCode: "NM",
            stateName: "NEW MEXICO"
        });
    });
    test("parseWeatherStations()", async () => {
        const [[, source]] = await readResources("./integrations/faa/nfdc/18_May_2023_CSV.zip"),
            zip = await jszip.loadAsync(source),
            stations = await instance.parseWeatherStations(zip.file("AWOS.csv")),
            sortedStations = _.sortBy(stations, "ident"),
            olg = sortedStations.filter(next => "OLG" === next.ident)[0]!,
            types = _.uniq(_.map(sortedStations, "type")).sort();
        expect(sortedStations.length).toBe(2584);
        expect(olg).toStrictEqual({
            cityName: "SOLON SPRINGS",
            countryCode: "US",
            ident: "OLG",
            coordinates: {
                latitude: 46.31531666,
                longitude: -91.81826111
            },
            stateCode: "WI",
            type: "awos 3"
        });
        expect(types).toStrictEqual([
            "asos",
            "awos 1",
            "awos 2",
            "awos 3",
            "awos 3 p",
            "awos 3 pt",
            "awos 3 t",
            "awos 4",
            "awos a",
            "awos av"
        ]);
    });
});
