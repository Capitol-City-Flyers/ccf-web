import {OpenSkyResponseParser, StatesAllResponse} from "../../../src/integrations/opensky/OpenSkyResponseParser";
import {DateTime} from "luxon";
import {AircraftIdent} from "../../../src/aircraft/aircraft-types";

describe("OpenSkyResponseParser", () => {
    const instance = OpenSkyResponseParser.create();
    test("parseStatesAllResponse()", () => {
        const aircraft: Array<AircraftIdent> = [{
                tailNumber: "N12345",
                modeSCodeHex: "A6692D"
            }, {
                tailNumber: "N23456",
                modeSCodeHex: "A7ED0D"
            }, {
                tailNumber: "N34567",
                modeSCodeHex: "A05B83"
            }],
            response: StatesAllResponse = {
                "time": 1686400853,
                "states": [
                    ["a6692d", "DAL859  ", "United States", 1686400853, 1686400853, -89.3742, 43.0094, 10972.8, false, 206.86, 268.72, -1.3, null, 11285.22, "3550", false, 0],
                    ["a7ed0d", "N61GT   ", "United States", 1686400853, 1686400853, -89.084, 42.7593, 2019.3, false, 96.69, 65.48, -2.93, null, 2004.06, null, false, 0],
                    ["a05b83", "N122DZ  ", "United States", 1686400852, 1686400852, -89.812, 42.52, 1562.1, false, 77.11, 65.14, 0.33, null, 1539.24, null, false, 0]
                ]
            },
            positions = instance.parseStatesAllResponse(response, aircraft);
        expect(positions).toStrictEqual([
            {
                aircraft: aircraft[0],
                position: {
                    altitude: 36_000,
                    heading: 268.72,
                    latitude: 43.0094,
                    longitude: -89.3742
                },
                onGround: false,
                timestamp: DateTime.fromMillis(1686400853000, {zone: "UTC"})
            },
            {
                aircraft: aircraft[1],
                position: {
                    altitude: 6_625,
                    heading: 65.48,
                    latitude: 42.7593,
                    longitude: -89.084
                },
                onGround: false,
                timestamp: DateTime.fromMillis(1686400853000, {zone: "UTC"})
            },
            {
                aircraft: aircraft[2],
                position: {
                    altitude: 5_125,
                    heading: 65.14,
                    latitude: 42.52,
                    longitude: -89.812
                },
                onGround: false,
                timestamp: DateTime.fromMillis(1686400852000, {zone: "UTC"})
            }
        ]);
    });
});
