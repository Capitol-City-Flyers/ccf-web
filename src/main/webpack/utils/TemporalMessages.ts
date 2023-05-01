import {freeze, immerable} from "immer";
import {findLast} from "lodash";
import {DateTime, DurationUnits, Interval} from "luxon";
import {DateRange, LocalDateFormat} from "./DateUtils";
import {MessageResolver} from "./MessageUtils";

export class TemporalMessages {
    [immerable] = true;

    private constructor(private resolver: MessageResolver, private format: LocalDateFormat) {
    }

    describeDuration(reference: Date, range: Interval) {

        /* For durations >= 1 day, use number of (full) days. */
        const diff = range.toDuration(["days", "hours", "minutes"]),
            {days, hours} = diff;
        if (1 === days) {
            if (hours >= 12) {
                return this.resolver.resolve("ccf.duration.one-day-and-one-half-day");
            }
            return this.resolver.resolve("ccf.duration.one-day");
        } else if (days >= 2) {
            if (hours >= 12) {
                return this.resolver.resolve("ccf.duration.days-and-one-half-day", days);
            }
            return this.resolver.resolve("ccf.duration.days", days);
        }

        /* For durations < 1 day, use casual hours/quarter hours. */
        const {minutes} = diff,
            [, messages] = findLast(messagesSubOneDay,
                ([nextMinutes]) => nextMinutes <= minutes)!;
        return this.resolver.resolve(messages[Math.min(hours, 2)], hours);
    }

    private toDateTime(date: Date) {
        return DateTime.fromJSDate(date, {zone: this.format.timeZone});
    }

    private diff(range: DateRange, units: DurationUnits) {
        return this.toDateTime(range[1]).diff(this.toDateTime(range[0]), units, {
            conversionAccuracy: "casual"
        });
    }

    static create(resolver: MessageResolver, format: LocalDateFormat) {
        return freeze(new TemporalMessages(resolver, format));
    }
}

/**
 * Map of quarter-hour (minute) increments to corresponding message keys to use when number of hours in a duration is
 * *[0, 1, >1]*.
 */
const messagesSubOneDay = freeze<Array<[number, [string, string, string]]>>([
    [0, [
        "ccf.duration.less-than-fifteen-minutes",
        "ccf.duration.one-hour",
        "ccf.duration.hours"
    ]],
    [15, [
        "ccf.duration.fifteen-minutes",
        "ccf.duration.one-hour-fifteen-minutes",
        "ccf.duration.hours-fifteen-minutes"
    ]],
    [30, [
        "ccf.duration.thirty-minutes",
        "ccf.duration.one-hour-thirty-minutes",
        "ccf.duration.hours-thirty-minutes"
    ]],
    [45, [
        "ccf.duration.forty-five-minutes",
        "ccf.duration.one-hour-forty-five-minutes",
        "ccf.duration.hours-forty-five-minutes"
    ]]
]);
