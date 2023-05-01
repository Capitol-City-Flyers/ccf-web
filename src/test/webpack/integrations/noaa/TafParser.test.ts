import {readZippedTextFiles} from "../../utils/TestDataUtils";
import {parseCycle} from "../../../../main/webpack/integrations/noaa/CycleUtils";
import {parseTaf} from "../../../../main/webpack/integrations/noaa/TafParser";
import {ParsingError} from "tokenizr";

describe("TafParser", () => {
    describe("parseTaf()", () => {
        test("00Z.txt", async () =>
            readZippedTextFiles("./responses/noaa/taf-2023-04-24.zip", "00Z.txt")
                .then(([[, cycle]]) => {
                    const start = 603,
                        entries = parseCycle(cycle).slice(start);
                    entries.forEach((entry, index) => {
                        try {
                            parseTaf(entry);
                        } catch (ex) {
                            const error = ex as ParsingError,
                                entryIndex = start + index,
                                text = error.input.substring(error.pos);
                            console.log(`Error in entry ${entryIndex}: ${ex}`, text, ex);
                        }
                    });
                }));
    });
});
