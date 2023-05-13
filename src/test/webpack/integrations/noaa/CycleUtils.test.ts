import {readUtf8TextResources} from "../../utils/TestDataUtils";
import {iterateEntries} from "../../../../main/webpack/integrations/noaa/CycleUtils";
import _ from "lodash";

describe("CycleUtils", () => {
    describe("iterateEntries()", () => {
        // test("Test cycles", async () => readUtf8TextResources("./cycles/noaa/**/*.txt.br")
        //     .then(matches => {
        //         const counts = _.sortBy(matches.map(([{base}, cycle]) =>
        //             [base, _.toArray(iterateEntries(cycle)).length]), 0);
        //         expect(counts).toStrictEqual([
        //             ["metar-20230429-00Z.txt.br", 34278],
        //             ["metar-20230429-01Z.txt.br", 34132],
        //             ["metar-20230429-02Z.txt.br", 34543],
        //             ["metar-20230429-03Z.txt.br", 34743],
        //             ["metar-20230429-04Z.txt.br", 34828],
        //             ["metar-20230429-05Z.txt.br", 34905],
        //             ["metar-20230429-06Z.txt.br", 35469],
        //             ["metar-20230429-07Z.txt.br", 35667],
        //             ["metar-20230429-08Z.txt.br", 35638],
        //             ["metar-20230429-09Z.txt.br", 35850],
        //             ["metar-20230429-10Z.txt.br", 36211],
        //             ["metar-20230429-11Z.txt.br", 36215],
        //             ["metar-20230429-12Z.txt.br", 36199],
        //             ["metar-20230429-13Z.txt.br", 36006],
        //             ["metar-20230429-14Z.txt.br", 35433],
        //             ["metar-20230429-15Z.txt.br", 35435],
        //             ["metar-20230429-16Z.txt.br", 35474],
        //             ["metar-20230429-17Z.txt.br", 34959],
        //             ["metar-20230429-18Z.txt.br", 34950],
        //             ["metar-20230429-19Z.txt.br", 15263],
        //             ["metar-20230429-20Z.txt.br", 33754],
        //             ["metar-20230429-21Z.txt.br", 35329],
        //             ["metar-20230429-22Z.txt.br", 35178],
        //             ["metar-20230429-23Z.txt.br", 35188],
        //             ["taf-20230424-00Z.txt.br", 10076],
        //             ["taf-20230424-06Z.txt.br", 10701],
        //             ["taf-20230424-12Z.txt.br", 7511],
        //             ["taf-20230424-18Z.txt.br", 10537]
        //         ]);
        //     }));
    });
    describe("parseMetar()", () => {
        test("Test cycles", async () => {
            const {parseMetar} = await import("metar-taf-parser"),
                matches = await readUtf8TextResources("./cycles/noaa/metar/*.txt.br"),
                failures = _.transform(matches, (acc, [{base}, cycle]) => {
                    for (const {content, issued} of iterateEntries(cycle)) {
                        try {
                            parseMetar(content, {issued: issued.toJSDate()});
                        } catch (ex) {
                            acc.push([base, "other", content, ex]);
                        }
                    }
                }, new Array<[string, string, string, any]>());
            console.log(JSON.stringify(failures, null, 4));
            expect(failures).toHaveLength(0);
        });
    });
    // describe("parseTAF()", () => {
    //     test("Test cycles", async () => {
    //         const {parseTAF} = await import("metar-taf-parser"),
    //             matches = await readUtf8TextResources("./cycles/noaa/taf/*.txt.br"),
    //             failures = _.transform(matches, (acc, [{base}, cycle]) => {
    //                 for (const {content, issued} of iterateEntries(cycle)) {
    //                     try {
    //                         parseTAF(content, {issued: issued.toJSDate()});
    //                     } catch (ex) {
    //                         const [first, ...additional] = content.split(/\s+/);
    //                         if ("PART" === first) {
    //                             acc.push([base, "partial", content, ex]);
    //                         } else if (first.length < 3 || first.length > 4) {
    //                             acc.push([base, "bad first token", content, ex]);
    //                         } else if (-1 !== additional.indexOf("SLLP") && -1 !== additional.indexOf("3000E")) {
    //                             acc.push([base, "sllp 3000E", content, ex]);
    //                         } else {
    //                             acc.push([base, "other", content, ex]);
    //                         }
    //                     }
    //                 }
    //             }, new Array<[string, string, string, any]>()),
    //             failureCountsByType = _.mapValues(_.groupBy(failures, 1), all => all.length);
    //
    //         /* Note: there should be zero "other" (unexpected) errors. */
    //         expect(_.sortBy(Object.entries(failureCountsByType), 0))
    //             .toStrictEqual([
    //                 ["bad first token", 3],
    //                 ["partial", 38],
    //                 ["sllp 3000E", 6]
    //             ]);
    //     });
    // });
});
