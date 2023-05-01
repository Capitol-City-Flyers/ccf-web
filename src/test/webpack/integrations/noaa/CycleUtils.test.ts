import {parseCycle} from "../../../../main/webpack/integrations/noaa/CycleUtils";
import _ from "lodash";
import {readZippedTextFiles} from "../../utils/TestDataUtils";

describe("CycleUtils", () => {
    describe("parseCycle()", () => {
        test("METAR", async () =>
            readZippedTextFiles("./responses/noaa/metar-2023-04-29.zip").then(cycles => {
                const entriesByCycleName = _.mapValues(Object.fromEntries(cycles), cycle => parseCycle(cycle));
                expect(_.mapValues(entriesByCycleName, "length")).toStrictEqual({
                    "00Z.txt": 34_278,
                    "01Z.txt": 34_132,
                    "02Z.txt": 34_543,
                    "03Z.txt": 34_743,
                    "04Z.txt": 34_828,
                    "05Z.txt": 34_905,
                    "06Z.txt": 35_469,
                    "07Z.txt": 35_667,
                    "08Z.txt": 35_638,
                    "09Z.txt": 35_850,
                    "10Z.txt": 36_211,
                    "11Z.txt": 36_215,
                    "12Z.txt": 36_199,
                    "13Z.txt": 36_006,
                    "14Z.txt": 35_433,
                    "15Z.txt": 35_435,
                    "16Z.txt": 35_474,
                    "17Z.txt": 34_959,
                    "18Z.txt": 34_950,
                    "19Z.txt": 15_263,
                    "20Z.txt": 33_754,
                    "21Z.txt": 35_329,
                    "22Z.txt": 35_178,
                    "23Z.txt": 35_188,
                });
            }));
        test("TAF", async () =>
            readZippedTextFiles("./responses/noaa/taf-2023-04-24.zip").then(cycles => {
                const entriesByCycleName = _.mapValues(Object.fromEntries(cycles), cycle => parseCycle(cycle));
                expect(_.mapValues(entriesByCycleName, "length")).toStrictEqual({
                    "00Z.txt": 10_076,
                    "06Z.txt": 10_701,
                    "12Z.txt": 7_511,
                    "18Z.txt": 10_537
                });
            }));
    });
});
