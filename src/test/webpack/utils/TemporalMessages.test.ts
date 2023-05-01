import {DateTime} from "luxon";
import _ from "lodash";
import {TemporalMessages} from "../../../main/webpack/utils/TemporalMessages";
import {LocalDateFormat} from "../../../main/webpack/utils/DateUtils";
import {MessageRef, MessageResolver} from "../../../main/webpack/utils/MessageUtils";

describe("TemporalMessages", () => {
    const resolver: MessageResolver = {
            resolve(message: MessageRef, ...params: Array<any>): string {
                expect(_.isString(message)).toBe(true);
                return `${message}[${params.join(",")}]`;
            }
        },
        format = LocalDateFormat.create("en-US", "America/Chicago"),
        instance = TemporalMessages.create(resolver, format);
    describe("describeDuration()", () => {
        test("Less than fifteen minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({minute: 1}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.less-than-fifteen-minutes[0]");
        });
        test("Fifteen minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({minute: 15}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.fifteen-minutes[0]");
        });
        test("Thirty minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({minute: 30}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.thirty-minutes[0]");
        });
        test("Forty-five minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({minute: 45}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.forty-five-minutes[0]");
        });
        test("One hour", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({hour: 1}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.one-hour[1]");
        });
        test("One hour and fifteen minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({hour: 1, minute: 15}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.one-hour-fifteen-minutes[1]");
        });
        test("One hour and thirty minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({hour: 1, minute: 30}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.one-hour-thirty-minutes[1]");
        });
        test("One hour and forty-five minutes", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({hour: 1, minute: 45}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.one-hour-forty-five-minutes[1]");
        });
        test("Two hours or more, less than one day", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({hour: 2}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.hours[2]");
        });
        test("One day", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({day: 1}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.one-day[]");
        });
        test("One and a half days", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({day: 1, hour: 12}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.one-day-and-one-half-day[]");
        });
        test("Two days", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({day: 2}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.days[2]");
        });
        test("Two and a half days", () => {
            const reference = new Date("2023-04-09T05:00:00Z"),
                start = DateTime.fromJSDate(reference, {zone: "America/Chicago"}),
                range = start.until(start.plus({day: 2, hour: 12}));
            expect(instance.describeDuration(reference, range))
                .toStrictEqual("ccf.duration.days-and-one-half-day[2]");
        });
    });
});
