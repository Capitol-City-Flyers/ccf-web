import {readUtf8TextResources} from "../../utils/TestDataUtils";
import {cycleEntries, parseTafCycle} from "../../../../main/webpack/integrations/noaa/NewTafParser";

describe("TafParser", () => {
    test("Test", async () =>
        readUtf8TextResources("./cycles/noaa/taf/taf-20230424-00Z.txt.br")
            .then(matches => {
                matches.forEach(([{base}, cycle]) => {
                    const entries = new Array<string>();
                    for (let entry of cycleEntries(cycle)) {
                        entries.push(entry);
                    }
                    console.log(JSON.stringify(entries));
                });
            }));
});
