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
            msn = airports.filter(a => "MSN" === a.ident)[0]!;
        expect(airports.length).toBe(19955);
        expect(msn).toStrictEqual({
            cityName: 'MADISON',
            location: {
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
            location: {
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
