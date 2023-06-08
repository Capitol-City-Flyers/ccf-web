import {DateTime} from "luxon";
import {cycleInterval} from "../../../src/utilities/date-utils";
import Axios from "axios";

/**
 * Get the base name of a NASR cycle file, for example, `18_May_2023`. The cycle date is determined from a `reference`
 * date and an offset. To get the *current* cycle at a given date/time, pass `0` as the offset. To get the *previous*
 * cycle, pass `-1`. To get the *next* cycle, pass `1`.
 *
 * @param reference
 * @param offset
 */
function nasrCycleName(reference: DateTime, offset: number = 0) {
    const base = DateTime.fromISO("2023-05-18T00:00:00Z", {zone: "UTC"}),
        start = cycleInterval(base, 28, reference, offset).start!;
    return `${start.setLocale("en").toFormat("dd_LLL_yyyy")}`;
}

describe("NASRAirportDataSource", () => {
    describe("nasrCycleName()", () => {
        test("Current at start of cycle", () => {
            expect(nasrCycleName(DateTime.fromISO("2023-04-20T00:00:00Z"), 0))
                .toBe("20_Apr_2023");
        });
        test("Current at end of cycle", () => {
            expect(nasrCycleName(DateTime.fromISO("2023-05-17T23:59:59.999Z"), 0))
                .toBe("20_Apr_2023");
        });
    });
});

