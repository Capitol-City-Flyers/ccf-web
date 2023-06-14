import {DateTime, Interval} from "luxon";
import {
    LocalDateFormat,
    DateRange,
    excludedRanges,
    julianDay,
    periodInterval,
    nowUTC,
    toFractions,
    toLengthFractions,
    toTransitions,
} from "../../src/utilities/date-utils";

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

describe("DateUtils", () => {
    test("Testing", () => {
        const madison = [ 43.073051, -89.401230] as const,
            pds = [43.286933, -89.724012] as const;

        const distance = getDistanceFromLatLonInKm(...madison, ...pds);
        console.log(distance);
    });

    describe("periodInterval()", () => {
        describe("for a simple period in days", () => {
            const periodicity = {
                base: DateTime.fromISO("2023-03-23T00:00:00.000Z", {setZone: true}),
                duration: {days: 28}
            };
            test("with the default offset (zero)", () => {
                const reference = DateTime.fromISO("2023-05-17T23:59:59.999Z", {setZone: true}),
                    interval = periodInterval(periodicity, reference);
                expect(interval.toISO()).toBe("2023-04-20T00:00:00.000Z/2023-05-18T00:00:00.000Z");
            });
            test("with a negative offset", () => {
                const reference = DateTime.fromISO("2023-05-10T00:00:00Z", {setZone: true}),
                    interval = periodInterval(periodicity, reference, -5);
                expect(interval.toISO()).toBe("2022-12-01T00:00:00.000Z/2022-12-29T00:00:00.000Z");
            });
            test("with a positive offset", () => {
                const reference = DateTime.fromISO("2023-05-10T00:00:00Z", {setZone: true}),
                    interval = periodInterval(periodicity, reference, 5);
                expect(interval.toISO()).toBe("2023-09-07T00:00:00.000Z/2023-10-05T00:00:00.000Z");
            });
        });
        describe("for a simple period in quarters", () => {
            const periodicity = {
                base: DateTime.fromISO("2023-01-01T00:00:00.000Z", {setZone: true}),
                duration: {quarters: 1}
            };
            test("with the default offset (zero)", () => {
                const reference = DateTime.fromISO("2023-05-17T23:59:59.999Z", {setZone: true}),
                    interval = periodInterval(periodicity, reference);
                expect(interval.toISO()).toBe("2023-04-01T00:00:00.000Z/2023-07-01T00:00:00.000Z");
            });
            test("with a negative offset", () => {
                const reference = DateTime.fromISO("2023-05-10T00:00:00Z", {setZone: true}),
                    interval = periodInterval(periodicity, reference, -5);
                expect(interval.toISO()).toBe("2022-01-01T00:00:00.000Z/2022-04-01T00:00:00.000Z");
            });
            test("with a positive offset", () => {
                const reference = DateTime.fromISO("2023-05-10T00:00:00Z", {setZone: true}),
                    interval = periodInterval(periodicity, reference, 5);
                expect(interval.toISO()).toBe("2024-07-01T00:00:00.000Z/2024-10-01T00:00:00.000Z");
            });
        });
    });
    describe("julianDay()", () => {
        test("At end of day", () => {
            expect(julianDay(DateTime.fromISO("2023-04-19T23:59:59.999Z"))).toBe(2_460_053);
        });
        test("At start of day", () => {
            expect(julianDay(DateTime.fromISO("2023-04-20T00:00:00Z"))).toBe(2_460_054);
        });
    });
    test("nowUTC()", () => {
        const beforeOrSame = DateTime.now().setZone("UTC"),
            now = nowUTC(),
            afterOrSame = DateTime.now().setZone("UTC");
        expect(now.zoneName).toBe("UTC");
        expect(now.diff(beforeOrSame).toMillis()).toBeGreaterThanOrEqual(0);
        expect(now.diff(afterOrSame).toMillis()).toBeLessThanOrEqual(0);
    });
    describe("toTransitions()", () => {
        test("For an empty interval array", () => {
            expect(toTransitions([])).toStrictEqual([]);
        });
        test("For a single interval", () => {
            const intervals: Array<Interval> = [
                ["2023-04-22T00:00:00.000Z", "2023-04-23T00:00:00.000Z"]
            ].map(([start, end]) =>
                Interval.fromDateTimes(DateTime.fromISO(start).setZone("UTC"), DateTime.fromISO(end).setZone("UTC")));
            expect(toTransitions(intervals).map(time => time.toISO())).toStrictEqual([
                "2023-04-22T00:00:00.000Z",
                "2023-04-23T00:00:00.000Z"
            ]);
        });
        test("For a multiple abutted intervals", () => {
            const intervals: Array<Interval> = [
                ["2023-04-21T00:00:00.000Z", "2023-04-22T00:00:00.000Z"],
                ["2023-04-22T00:00:00.000Z", "2023-04-23T00:00:00.000Z"]
            ].map(([start, end]) =>
                Interval.fromDateTimes(DateTime.fromISO(start).setZone("UTC"), DateTime.fromISO(end).setZone("UTC")));
            expect(toTransitions(intervals).map(time => time.toISO())).toStrictEqual([
                "2023-04-21T00:00:00.000Z",
                "2023-04-23T00:00:00.000Z"
            ]);
        });
        test("For a multiple non-overlapped intervals", () => {
            const intervals: Array<Interval> = [
                ["2023-04-20T00:00:00.000Z", "2023-04-21T00:00:00.000Z"],
                ["2023-04-22T00:00:00.000Z", "2023-04-23T00:00:00.000Z"]
            ].map(([start, end]) =>
                Interval.fromDateTimes(DateTime.fromISO(start).setZone("UTC"), DateTime.fromISO(end).setZone("UTC")));
            expect(toTransitions(intervals).map(time => time.toISO())).toStrictEqual([
                "2023-04-20T00:00:00.000Z",
                "2023-04-21T00:00:00.000Z",
                "2023-04-22T00:00:00.000Z",
                "2023-04-23T00:00:00.000Z"
            ]);
        });
        test("For a multiple overlapped intervals", () => {
            const intervals: Array<Interval> = [
                ["2023-04-20T00:00:00.000Z", "2023-04-23T00:00:00.000Z"],
                ["2023-04-21T00:00:00.000Z", "2023-04-22T00:00:00.000Z"]
            ].map(([start, end]) =>
                Interval.fromDateTimes(DateTime.fromISO(start).setZone("UTC"), DateTime.fromISO(end).setZone("UTC")));
            expect(toTransitions(intervals).map(time => time.toISO())).toStrictEqual([
                "2023-04-20T00:00:00.000Z",
                "2023-04-23T00:00:00.000Z"
            ]);
        });
    });

    describe("excludedRanges()", () => {
        const bounds: DateRange = [new Date("2023-03-17T00:00:00Z"), new Date("2023-03-18T00:00:00Z")];
        test("No included ranges", () => {
            expect(excludedRanges(bounds, [])).toStrictEqual([bounds]);
        });
        test("Included range with no overlap (after)", () => {
            expect(excludedRanges(bounds, [
                [new Date("2023-03-18T00:00:00Z"), new Date("2023-03-18T00:00:00Z")]
            ])).toStrictEqual([bounds]);
        });
        test("Included range with no overlap (before)", () => {
            expect(excludedRanges(bounds, [
                [new Date("2023-03-16T00:00:00Z"), new Date("2023-03-17T00:00:00Z")]
            ])).toStrictEqual([bounds]);
        });
        test("Included range with overlap (after)", () => {
            expect(excludedRanges(bounds, [
                [new Date("2023-03-17T12:34:56.789Z"), new Date("2023-03-18T12:34:56.789Z")]
            ])).toStrictEqual([
                [new Date("2023-03-17T00:00:00Z"), new Date("2023-03-17T12:34:56.789Z")]
            ]);
        });
        test("Included range with overlap (before)", () => {
            expect(excludedRanges(bounds, [
                [new Date("2023-03-16T12:34:56.789Z"), new Date("2023-03-17T12:34:56.789Z")]
            ])).toStrictEqual([
                [new Date("2023-03-17T12:34:56.789Z"), new Date("2023-03-18T00:00:00Z")]
            ]);
        });
        test("Included discrete ranges", () => {
            expect(excludedRanges(bounds, [
                [new Date("2023-03-17T02:00:00Z"), new Date("2023-03-17T04:00:00Z")],
                [new Date("2023-03-17T05:00:00Z"), new Date("2023-03-17T06:00:00Z")]
            ])).toStrictEqual([
                [new Date("2023-03-17T00:00:00Z"), new Date("2023-03-17T02:00:00Z")],
                [new Date("2023-03-17T04:00:00Z"), new Date("2023-03-17T05:00:00Z")],
                [new Date("2023-03-17T06:00:00Z"), new Date("2023-03-18T00:00:00Z")]
            ]);
        });
        test("Included overlapping ranges", () => {
            expect(excludedRanges(bounds, [
                [new Date("2023-03-17T02:00:00Z"), new Date("2023-03-17T04:00:00Z")],
                [new Date("2023-03-17T03:00:00Z"), new Date("2023-03-17T05:00:00Z")]
            ])).toStrictEqual([
                [new Date("2023-03-17T00:00:00Z"), new Date("2023-03-17T02:00:00Z")],
                [new Date("2023-03-17T05:00:00Z"), new Date("2023-03-18T00:00:00Z")]
            ]);
        });
    });
    describe("toFractions()", () => {
        test("For a known interval", () => {
            const interval = Interval.fromDateTimes(
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ),
                values = [
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-16T02:00:00Z"),
                    DateTime.fromISO("2023-04-16T03:00:00Z"),
                    DateTime.fromISO("2023-04-16T06:00:00Z"),
                    DateTime.fromISO("2023-04-16T16:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ];
            expect(toFractions(interval, values))
                .toStrictEqual([0, 0.08333333333333333, 0.125, 0.25, 0.6666666666666666, 1]);
        });
    });
    describe("toLengthFractions()", () => {
        test("No sub-intervals", () => {
            const interval = Interval.fromDateTimes(
                DateTime.fromISO("2023-04-16T00:00:00Z"),
                DateTime.fromISO("2023-04-17T00:00:00Z")
            );
            expect(toLengthFractions(interval, [])).toStrictEqual([1]);
        });
        test("Single sub-interval at start", () => {
            const interval = Interval.fromDateTimes(
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ),
                values = [DateTime.fromISO("2023-04-16T00:00:00Z")];
            expect(toLengthFractions(interval, values)).toStrictEqual([0, 1]);
        });
        test("Single sub-interval at end", () => {
            const interval = Interval.fromDateTimes(
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ),
                values = [DateTime.fromISO("2023-04-17T00:00:00Z")];
            expect(toLengthFractions(interval, values)).toStrictEqual([1, 0]);
        });
        test("Sub-intervals at both ends", () => {
            const interval = Interval.fromDateTimes(
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ),
                values = [
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ];
            expect(toLengthFractions(interval, values)).toStrictEqual([0, 1, 0]);
        });
        test("Multiple sub-intervals", () => {
            const interval = Interval.fromDateTimes(
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ),
                values = [
                    DateTime.fromISO("2023-04-16T00:00:00Z"),
                    DateTime.fromISO("2023-04-16T02:00:00Z"),
                    DateTime.fromISO("2023-04-16T03:00:00Z"),
                    DateTime.fromISO("2023-04-16T06:00:00Z"),
                    DateTime.fromISO("2023-04-16T16:00:00Z"),
                    DateTime.fromISO("2023-04-17T00:00:00Z")
                ];
            expect(toLengthFractions(interval, values))
                .toStrictEqual([
                    0,
                    0.08333333333333333,
                    0.04166666666666667,
                    0.125,
                    0.41666666666666663,
                    0.33333333333333337,
                    0
                ]);
        });
    });
    describe("LocalDateFormat", () => {
        describe("America/Chicago zone and en-US locale", () => {
            const instance = LocalDateFormat.create("en-US", "America/Chicago"),
                now = DateTime.fromJSDate(new Date(), {zone: "America/Chicago"}),
                nowDate = now.toJSDate();
            describe("format()", () => {
                const date = new Date("2023-03-17T12:34:56.789Z");
                test("Default (short date and time)", () => {
                    expect(instance.format(date)).toStrictEqual("3/17/23, 7:34 AM");
                });
                test("Short date", () => {
                    expect(instance.format(date, ["date"])).toStrictEqual("3/17/23");
                });
                test("Short date and time", () => {
                    expect(instance.format(date, ["date", "time"])).toStrictEqual("3/17/23, 7:34 AM");
                });
                test("Short time", () => {
                    expect(instance.format(date, ["time"])).toStrictEqual("7:34 AM");
                });
                test("Medium date", () => {
                    expect(instance.format(date, ["date"], "medium")).toStrictEqual("Mar 17, 2023");
                });
                test("Medium date and time", () => {
                    expect(instance.format(date, ["date", "time"], "medium")).toStrictEqual("Mar 17, 2023, 7:34:56 AM");
                });
                test("Medium time", () => {
                    expect(instance.format(date, ["time"], "medium")).toStrictEqual("7:34:56 AM");
                });
                test("Long date", () => {
                    expect(instance.format(date, ["date"], "long")).toStrictEqual("March 17, 2023");
                });
                test("Long date and time", () => {
                    expect(instance.format(date, ["date", "time"], "long")).toStrictEqual("March 17, 2023 at 7:34:56 AM CDT");
                });
                test("Long time", () => {
                    expect(instance.format(date, ["time"], "long")).toStrictEqual("7:34:56 AM CDT");
                });
            });
            describe("formatRelativeDuration()", () => {
                test("Zero duration", () => {
                    expect(instance.formatRelativeDuration([nowDate, nowDate]))
                        .toStrictEqual("0 seconds");
                });
                test("Second duration", () => {
                    expect(instance.formatRelativeDuration([
                        nowDate,
                        now.plus({second: 1}).toJSDate()
                    ])).toStrictEqual("1 second");
                });
                test("Minute duration", () => {
                    expect(instance.formatRelativeDuration([
                        nowDate,
                        now.plus({minute: 1}).toJSDate()
                    ])).toStrictEqual("1 minute");
                });
                test("Hour duration", () => {
                    expect(instance.formatRelativeDuration([
                        nowDate,
                        now.plus({hour: 1}).toJSDate()
                    ])).toStrictEqual("1 hour");
                });
                test("Day duration", () => {
                    expect(instance.formatRelativeDuration([
                        nowDate,
                        now.plus({day: 1}).toJSDate()
                    ])).toStrictEqual("1 day");
                });
                test("Month duration", () => {
                    expect(instance.formatRelativeDuration([
                        nowDate,
                        now.plus({month: 1}).toJSDate()
                    ])).toStrictEqual("1 month");
                });
                test("Year duration", () => {
                    expect(instance.formatRelativeDuration([
                        nowDate,
                        now.plus({year: 1}).toJSDate()
                    ])).toStrictEqual("1 year");
                });
            });
            describe("formatRelative()", () => {
                describe("In the future", () => {
                    test("Zero duration", () => {
                        expect(instance.formatRelative([nowDate, nowDate]))
                            .toStrictEqual("now");
                    });
                    test("Second duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.plus({second: 1}).toJSDate()
                        ])).toStrictEqual("in 1 second");
                    });
                    test("Minute duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.plus({minute: 1}).toJSDate()
                        ])).toStrictEqual("in 1 minute");
                    });
                    test("Hour duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.plus({hour: 1}).toJSDate()
                        ])).toStrictEqual("in 1 hour");
                    });
                    test("Day duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.plus({day: 1}).toJSDate()
                        ])).toStrictEqual("tomorrow");
                    });
                    test("Month duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.plus({month: 1}).toJSDate()
                        ])).toStrictEqual("next month");
                    });
                    test("Year duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.plus({year: 1}).toJSDate()
                        ])).toStrictEqual("next year");
                    });
                });
                describe("In the past", () => {
                    test("Zero duration", () => {
                        expect(instance.formatRelative([nowDate, nowDate]))
                            .toStrictEqual("now");
                    });
                    test("Second duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.minus({second: 1}).toJSDate()
                        ])).toStrictEqual("1 second ago");
                    });
                    test("Minute duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.minus({minute: 1}).toJSDate()
                        ])).toStrictEqual("1 minute ago");
                    });
                    test("Hour duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.minus({hour: 1}).toJSDate()
                        ])).toStrictEqual("1 hour ago");
                    });
                    test("Day duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.minus({day: 1}).toJSDate()
                        ])).toStrictEqual("yesterday");
                    });
                    test("Month duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.minus({month: 1}).toJSDate()
                        ])).toStrictEqual("last month");
                    });
                    test("Year duration", () => {
                        expect(instance.formatRelative([
                            nowDate,
                            now.minus({year: 1}).toJSDate()
                        ])).toStrictEqual("last year");
                    });
                });
            });
        });
    });
});
