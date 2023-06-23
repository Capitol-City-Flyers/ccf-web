import {flightCategoryIntervals} from "../../src/utilities/weather-utils";

describe("weather-utils.ts", () => {
    describe("flightCategoryIntervals()", () => {
        test("Known TAF", () => {
            const taf = [
                "KMSN 231740Z 2318/2418 03005KT 6SM HZ SCT060",
                "FM240000 VRB04KT P6SM FEW250",
                "FM241700 18007KT P6SM SCT240"
            ].join("\n");
            flightCategoryIntervals(taf);
        });
    });
});
