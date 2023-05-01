import fs from "fs";
import path from "path";
import JSZip from "jszip";
import {
    parseDayHourInterval,
    parseDayTime, parseTafEntry,
    splitCycle,
    tokenizeEntry
} from "../../../../main/webpack/integrations/noaa/NoaaParseUtils";
import {DateTime, Interval} from "luxon";


describe("NoaaParseUtils", () => {
    describe("parse()", () => {
        describe("parseDayHourInterval()", () => {
            const april29 = DateTime.fromISO("2023-04-29T18:00:00.000", {zone: "UTC"}),
                april30 = DateTime.fromISO("2023-04-30T18:00:00.000", {zone: "UTC"});
            test("Crossing end of month at end only", () => {
                expect(parseDayHourInterval(april30, "3018/0112"))
                    .toStrictEqual(Interval.fromDateTimes(
                        DateTime.fromISO("2023-04-30T18:00:00.000", {zone: "UTC"}),
                        DateTime.fromISO("2023-05-01T12:00:00.000", {zone: "UTC"})));
            });
            test("Crossing end of month at start and end", () => {
                expect(parseDayHourInterval(april30, "0106/0112"))
                    .toStrictEqual(Interval.fromDateTimes(
                        DateTime.fromISO("2023-05-01T06:00:00.000", {zone: "UTC"}),
                        DateTime.fromISO("2023-05-01T12:00:00.000", {zone: "UTC"})));
            });
            test("Same day", () => {
                expect(parseDayHourInterval(april30, "3018/3020"))
                    .toStrictEqual(Interval.fromDateTimes(
                        DateTime.fromISO("2023-04-30T18:00:00.000", {zone: "UTC"}),
                        DateTime.fromISO("2023-04-30T20:00:00.000", {zone: "UTC"})));
            });
            test("Next day", () => {
                expect(parseDayHourInterval(april29, "3006/3012"))
                    .toStrictEqual(Interval.fromDateTimes(
                        DateTime.fromISO("2023-04-30T06:00:00.000", {zone: "UTC"}),
                        DateTime.fromISO("2023-04-30T12:00:00.000", {zone: "UTC"})));
            });
        });
        describe("parseDayTime()", () => {
            const april29 = DateTime.fromISO("2023-04-29T18:00:00.000", {zone: "UTC"}),
                april30 = DateTime.fromISO("2023-04-30T18:00:00.000", {zone: "UTC"});
            test("Crossing end of month", () => {
                expect(parseDayTime(april30, "010600Z"))
                    .toStrictEqual(DateTime.fromISO("2023-05-01T06:00:00.000", {zone: "UTC"}))
            });
            test("Not crossing end of month", () => {
                expect(parseDayTime(april29, "300600Z"))
                    .toStrictEqual(DateTime.fromISO("2023-04-30T06:00:00.000", {zone: "UTC"}))
            });
        });
        describe("parseTafEntry()", () => {
            test("", async () =>
                readCycles("taf-2023-04-24.zip").then(cycles => {
                    cycles.forEach(([name, content]) => {
                        splitCycle(content).map(tokenizeEntry).map(entry => {
                            try {
                                parseTafEntry(entry);
                            } catch (ex) {
                                console.dir(ex);
                            }
                        });
                    });
                }));
        });
        describe("splitCycle()", () => {
            test("Test cycle 2023-04-24", async () =>
                readCycles("taf-2023-04-24.zip")
                    .then(cycles => {
                            const counts = cycles.map(([name, text]) => [name, splitCycle(text).length] as const);
                            expect(Object.fromEntries(counts))
                                .toStrictEqual({
                                    "00Z.txt": 10059,
                                    "06Z.txt": 10691,
                                    "12Z.txt": 7500,
                                    "18Z.txt": 10520
                                });
                        }
                    ));
        });
        describe("tokenizeEntry()", () => {
            test("Test cycle 2023-04-24", async () =>
                readCycles("taf-2023-04-24.zip")
                    .then(cycles => {
                        cycles.forEach(([, text]) => {
                            splitCycle(text).forEach(entry => {

                                /* Split first line from second through last ("remaining") lines. */
                                const normalized = tokenizeEntry(entry),
                                    {lines: [first, ...remaining]} = normalized;

                                /* First line should not contain "AMD", "COR", or "TAF". */
                                expect(first).not.toContain("AMD");
                                expect(first).not.toContain("COR");
                                expect(first).not.toContain("TAF");

                                /* Second through last lines should begin with one of a few prefixes. */
                                remaining.forEach(([first]) => {
                                    expect(
                                        (first.startsWith("FM") ? 1 : 0)
                                        + ("AMD" === first ? 1 : 0)
                                        + ("AMDS" === first ? 1 : 0)
                                        + ("BECMG" === first ? 1 : 0)
                                        + ("RMK" === first ? 1 : 0)
                                        + ("TEMPO" === first ? 1 : 0)
                                    ).toBe(1);
                                });
                            });
                        })
                    }));
        });
    });
});

async function readCycles(cycle: string) {
    const file = path.join(__dirname, `../../../resources/responses/noaa/${cycle}`),
        zip = await JSZip.loadAsync(new Promise<Buffer>((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }));
    return await Promise.all(Object.entries(zip.files).map(([name, entry]) =>
        new Promise<[string, string]>((resolve, reject) => {
            let content = "";
            entry.nodeStream()
                .on("data", data => {
                    content += data;
                })
                .on("end", () => {
                    resolve([name, content]);
                })
                .on("error", err => {
                    reject(err);
                });
        })));
}
