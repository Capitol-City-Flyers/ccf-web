import {parseCycle} from "../../../../main/webpack/integrations/noaa/CycleUtils";
import {parseTaf} from "../../../../main/webpack/integrations/noaa/TafParser";
import {ParsingError} from "tokenizr";
import {readUtf8TextResources} from "../../utils/TestDataUtils";

describe("TafParser", () => {
    describe("parseTaf()", () => {
        test("00Z.txt", async () =>
            readUtf8TextResources("./cycles/noaa/taf/taf-20230424-00Z.txt.br")
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
