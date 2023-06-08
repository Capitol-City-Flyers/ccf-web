import {IANAZone, Interval} from "luxon";
import {DateCalc} from "../../src/utilities/DateCalc";

describe("DateCalc", () => {
    describe("America/Chicago zone", () => {
        const instance = DateCalc.create(IANAZone.create("America/Chicago"));
        describe("allOf()", () => {
            test("Single unit covers full range (start, end]", () => {
                expect(instance.allOf(1, "day", instance.toDateTime("2023-03-17T12:34:56.789Z")))
                    .toStrictEqual(instance.toDateTime("2023-03-17T05:00:00Z")
                        .until(instance.toDateTime("2023-03-18T05:00:00Z")));
            });
            test("Multiple unit covers full range (start, end]", () => {
                expect(instance.allOf(2, "week", instance.toDateTime("2023-03-17T12:34:56.789Z")))
                    .toStrictEqual(instance.toDateTime("2023-03-12T06:00:00Z")
                        .until(instance.toDateTime("2023-03-26T05:00:00Z")));
            });
        });
        describe("resolve()", () => {
            test("current day", () => {
                expect(instance.resolve("current day", instance.toDateTime("2023-04-16T05:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-04-16T05:00:00Z"),
                            instance.toDateTime("2023-04-17T05:00:00Z")
                        )
                    );
            });
            test("current month", () => {
                expect(instance.resolve("current month", instance.toDateTime("2023-03-17T00:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-03-01T06:00:00Z"),
                            instance.toDateTime("2023-04-01T05:00:00Z")
                        )
                    );
            });
            test("current week", () => {
                expect(instance.resolve("current week", instance.toDateTime("2023-03-13T05:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-03-12T06:00:00Z"),
                            instance.toDateTime("2023-03-19T05:00:00Z")
                        )
                    );
            });
            describe("current weekend", () => {
                test("before weekend", () => {
                    expect(instance.resolve("current weekend", instance.toDateTime("2023-04-14T05:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-15T05:00:00Z"),
                                instance.toDateTime("2023-04-17T05:00:00Z")
                            )
                        );
                });
                test("during weekend", () => {
                    expect(instance.resolve("current weekend", instance.toDateTime("2023-04-16T05:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-15T05:00:00Z"),
                                instance.toDateTime("2023-04-17T05:00:00Z")
                            )
                        );
                });
            });
            test("interval", () => {
                const interval = Interval.fromDateTimes(
                    instance.toDateTime("2023-04-16T05:00:00Z"),
                    instance.toDateTime("2023-04-17T05:00:00Z")
                );
                expect(instance.resolve(interval)).toBe(interval);
            });
            test("previous day", () => {
                expect(instance.resolve("previous day", instance.toDateTime("2023-04-16T05:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-04-15T05:00:00Z"),
                            instance.toDateTime("2023-04-16T05:00:00Z")
                        )
                    );
            });
            test("previous month", () => {
                expect(instance.resolve("previous month", instance.toDateTime("2023-04-17T00:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-03-01T06:00:00Z"),
                            instance.toDateTime("2023-04-01T05:00:00Z")
                        )
                    );
            });
            test("previous week", () => {
                expect(instance.resolve("previous week", instance.toDateTime("2023-04-17T00:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-04-09T05:00:00Z"),
                            instance.toDateTime("2023-04-16T05:00:00Z")
                        )
                    );
            });
            describe("previous weekend", () => {
                test("after weekend", () => {
                    expect(instance.resolve("previous weekend", instance.toDateTime("2023-04-17T05:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-15T05:00:00Z"),
                                instance.toDateTime("2023-04-17T05:00:00Z")
                            )
                        );
                });
                test("during weekend", () => {
                    expect(instance.resolve("previous weekend", instance.toDateTime("2023-04-16T00:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-08T05:00:00Z"),
                                instance.toDateTime("2023-04-10T05:00:00Z")
                            )
                        );
                });
            });
            test("next day", () => {
                expect(instance.resolve("next day", instance.toDateTime("2023-04-16T05:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-04-17T05:00:00Z"),
                            instance.toDateTime("2023-04-18T05:00:00Z")
                        )
                    );
            });
            test("next month", () => {
                expect(instance.resolve("next month", instance.toDateTime("2023-04-17T05:00:00Z")))
                    .toStrictEqual(
                        Interval.fromDateTimes(
                            instance.toDateTime("2023-05-01T05:00:00Z"),
                            instance.toDateTime("2023-06-01T05:00:00Z")
                        )
                    );
            });
            describe("next week", () => {
                test("on last day of week", () => {
                    expect(instance.resolve("next week", instance.toDateTime("2023-04-16T00:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-16T05:00:00Z"),
                                instance.toDateTime("2023-04-23T05:00:00Z")
                            )
                        );
                });
                test("not on last day of week", () => {
                    expect(instance.resolve("next week", instance.toDateTime("2023-04-17T05:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-23T05:00:00Z"),
                                instance.toDateTime("2023-04-30T05:00:00Z")
                            )
                        );
                });
            });
            describe("next weekend", () => {
                test("after weekend", () => {
                    expect(instance.resolve("next weekend", instance.toDateTime("2023-04-17T05:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-22T05:00:00Z"),
                                instance.toDateTime("2023-04-24T05:00:00Z")
                            )
                        );
                });
                test("during weekend", () => {
                    expect(instance.resolve("next weekend", instance.toDateTime("2023-04-16T00:00:00Z")))
                        .toStrictEqual(
                            Interval.fromDateTimes(
                                instance.toDateTime("2023-04-15T05:00:00Z"),
                                instance.toDateTime("2023-04-17T05:00:00Z")
                            )
                        );
                });
            });
        });
        describe("solarIntervals()", () => {
            describe("America/Chicago zone.", () => {
                test("In DST", () => {
                    const converted = ["2023-03-01T12:00:00Z", "2023-04-01T12:00:00Z"]
                        .map(iso => instance.toDateTime(iso))
                        .map(date => instance.solarIntervals(date, {
                            latitude: 43.2869331,
                            longitude: -89.7240116
                        }));
                    expect(converted).toStrictEqual([{
                        day: instance.toDateTime("2023-03-01T06:00:00.000Z")
                            .until(instance.toDateTime("2023-03-02T06:00:00.000Z")),
                        morningAstronomicalTwilight: instance.toDateTime("2023-03-01T11:02:26.107Z")
                            .until(instance.toDateTime("2023-03-01T11:35:29.191Z")),
                        morningNauticalTwilight: instance.toDateTime("2023-03-01T11:35:29.191Z")
                            .until(instance.toDateTime("2023-03-01T12:08:29.450Z")),
                        morningCivilTwilight: instance.toDateTime("2023-03-01T12:08:29.450Z")
                            .until(instance.toDateTime("2023-03-01T12:37:07.375Z")),
                        daylight: instance.toDateTime("2023-03-01T12:37:07.375Z")
                            .until(instance.toDateTime("2023-03-01T23:48:24.992Z")),
                        eveningCivilTwilight: instance.toDateTime("2023-03-01T23:48:24.992Z")
                            .until(instance.toDateTime("2023-03-02T00:17:02.916Z")),
                        eveningNauticalTwilight: instance.toDateTime("2023-03-02T00:17:02.916Z")
                            .until(instance.toDateTime("2023-03-02T00:50:03.176Z")),
                        eveningAstronomicalTwilight: instance.toDateTime("2023-03-02T00:50:03.176Z")
                            .until(instance.toDateTime("2023-03-02T01:23:06.259Z"))
                    }, {
                        day: instance.toDateTime("2023-04-01T05:00:00.000Z")
                            .until(instance.toDateTime("2023-04-02T05:00:00.000Z")),
                        morningAstronomicalTwilight: instance.toDateTime("2023-04-01T10:04:00.884Z")
                            .until(instance.toDateTime("2023-04-01T10:39:26.672Z")),
                        morningNauticalTwilight: instance.toDateTime("2023-04-01T10:39:26.672Z")
                            .until(instance.toDateTime("2023-04-01T11:13:35.579Z")),
                        morningCivilTwilight: instance.toDateTime("2023-04-01T11:13:35.579Z")
                            .until(instance.toDateTime("2023-04-01T11:42:23.160Z")),
                        daylight: instance.toDateTime("2023-04-01T11:42:23.160Z")
                            .until(instance.toDateTime("2023-04-02T00:25:33.586Z")),
                        eveningCivilTwilight: instance.toDateTime("2023-04-02T00:25:33.586Z")
                            .until(instance.toDateTime("2023-04-02T00:54:21.167Z")),
                        eveningNauticalTwilight: instance.toDateTime("2023-04-02T00:54:21.167Z")
                            .until(instance.toDateTime("2023-04-02T01:28:30.074Z")),
                        eveningAstronomicalTwilight: instance.toDateTime("2023-04-02T01:28:30.074Z")
                            .until(instance.toDateTime("2023-04-02T02:03:55.862Z"))
                    }]);
                });
                test("Not in DST", () => {
                    const converted = instance.solarIntervals(instance.toDateTime("2023-01-01T06:00:00Z"), {
                        latitude: 43.2869331,
                        longitude: -89.7240116
                    });
                    expect(converted).toStrictEqual({
                        day: instance.toDateTime("2023-01-01T06:00:00.000Z")
                            .until(instance.toDateTime("2023-01-02T06:00:00.000Z")),
                        morningAstronomicalTwilight: instance.toDateTime("2023-01-01T11:49:29.092Z")
                            .until(instance.toDateTime("2023-01-01T12:24:06.330Z")),
                        morningNauticalTwilight: instance.toDateTime("2023-01-01T12:24:06.330Z")
                            .until(instance.toDateTime("2023-01-01T13:00:00.700Z")),
                        morningCivilTwilight: instance.toDateTime("2023-01-01T13:00:00.700Z")
                            .until(instance.toDateTime("2023-01-01T13:32:26.270Z")),
                        daylight: instance.toDateTime("2023-01-01T13:32:26.270Z")
                            .until(instance.toDateTime("2023-01-01T22:34:35.400Z")),
                        eveningCivilTwilight: instance.toDateTime("2023-01-01T22:34:35.400Z")
                            .until(instance.toDateTime("2023-01-01T23:07:00.970Z")),
                        eveningNauticalTwilight: instance.toDateTime("2023-01-01T23:07:00.970Z")
                            .until(instance.toDateTime("2023-01-01T23:42:55.341Z")),
                        eveningAstronomicalTwilight: instance.toDateTime("2023-01-01T23:42:55.341Z")
                            .until(instance.toDateTime("2023-01-02T00:17:32.579Z"))
                    });
                });
            });
        });
        describe("remainderOf()", () => {
            test("Single unit covers full range (start, end]", () => {
                const start = instance.toDateTime("2023-03-17T12:34:56.789Z");
                expect(instance.remainderOf(1, "day", start))
                    .toStrictEqual(start.until(instance.toDateTime("2023-03-18T05:00:00Z")));
            });
            test("Multiple unit covers full range (start, end]", () => {
                expect(instance.remainderOf(2, "week", instance.toDateTime("2023-03-11T12:34:56.789Z")))
                    .toStrictEqual(instance.toDateTime("2023-03-11T12:34:56.789Z")
                        .until(instance.toDateTime("2023-03-19T05:00:00Z")));
            });
        });
    });
});
