import {freeze} from "immer";
import _ from "lodash";
import {DateTime, DurationUnit, Interval} from "luxon";

/**
 * Date range, `[start, end)`.
 */
export type DateRange = [Date, Date];

/**
 * Unix epoch in the UTC zone.
 */
export const EPOCH_UTC = DateTime.fromMillis(0, {zone: "UTC"});

/**
 * An interval which is known *not* to be invalid.
 */
export type ValidInterval = {
    [K in keyof Interval]: NonNullable<Interval[K]>
}

/**
 * Parts to include when formatting a literal date and/or time string.
 */
type DateTimePart =
    | "date"
    | "time";

/**
 * Date and time formatting styles, see {@link Intl.DateTimeFormat}.
 */
type DateTimeStyle =
    | "short"
    | "medium"
    | "long";

/**
 * Collapse overlapping and abutting ranges.
 *
 * Note: also normalizes and sorts ranges by start date, and the original array and its contents are not modified.
 *
 * @param ranges the ranges.
 */
function collapsedRanges(ranges: Array<DateRange>): Array<DateRange> {
    const sortedNormalized = _.sortBy(ranges.map(normalizedRange), 0);
    return _.transform(sortedNormalized, (acc, next) => {
        if (_.isEmpty(acc)) {
            acc.push(next);
        } else {
            const [start, end] = next,
                [previousStart, previousEnd] = acc[acc.length - 1];
            if (start > previousEnd) {
                acc.push(next);
            } else {
                acc.splice(acc.length - 1, 1, [previousStart, end]);
            }
        }
    }, new Array<DateRange>());
}

/**
 * Calculate the interval covered by a regular cycle, given:
 * * `base` date/time representing the known start date/time of some cycle.
 * * `length` of each cycle, in days.
 * * `reference` date/time with respect to which the cycle is to be calculated.
 * * `offset` from the current cycle as of the *reference* date time (`-1` for previous, `1` for next, etc.)
 *
 * The returned interval covers the range from the beginning of the cycle *start* day until the beginning of the *start*
 * day of the next cycle.
 *
 * @param base the known start of some cycle.
 * @param length the length of each cycle, in days.
 * @param reference the date/time for which to calculate the cycle.
 * @param offset the cycle offset from the *current* cycle at the reference date/time.
 */
export function cycleInterval(base: DateTime, length: number, reference: DateTime, offset: number = 0) {
    const diff = julianDay(reference.setZone(base.zone)) - julianDay(base),
        start = base.plus({day: Math.floor((diff / length) + offset) * length});
    return start.until(start.plus({day: length}));
}

/**
 * Get the Julian day number at a given date/time.
 *
 * @param date the date/time.
 */
export function julianDay(date: DateTime) {
    return Math.floor(date.setZone("UTC").startOf("day").toMillis() / 86_400_000 + 2440587.5);
}

/**
 * Normalize a date range, reversing its elements if they are not in ascending order.
 *
 * Note: the original range is not modified.
 *
 * @param range the range.
 */
export function normalizedRange(range: DateRange): DateRange {
    return range[0] <= range[1] ? range : [range[1], range[0]];
}

/**
 * Given a `bounds` range and an array of *included* `ranges`, return an array of *excluded* ranges; that is, ranges
 * covering the gaps between the *included* ranges. This is useful for finding the available slots in a schedule.
 *
 * Note: the bounds range and the original range array and its contents are not modified.
 *
 * @param bounds the bounding range.
 * @param ranges the *included* ranges.
 */
export function excludedRanges(bounds: DateRange, ranges: Array<DateRange>): Array<DateRange> {
    const normalizedBounds = normalizedRange(bounds),
        included = _.chunk([normalizedBounds[0], ..._.flatten(collapsedRanges(ranges)), normalizedBounds[1]], 2);
    return _.transform(included, (acc, [start, end]) => {
        if (end > start) {
            acc.push([start, end]);
        }
    }, new Array<DateRange>());
}

/**
 * Get *now* in the UTC zone as a {@link DateTime}.
 */
export function nowUTC() {
    return DateTime.now().setZone("UTC");
}

/**
 * Given a bounding interval and an array of zero or more date/times *within* that interval, return an array of numbers
 * representing the fractional (`[0..1]`) time within the bounding interval. In other words, if a date/time is equal to
 * the start of the bounding interval, `0` is returned as the corresponding fraction; if it is equal to the end of the
 * bounding interval, `1` is returned; if it is exactly at the middle of the interval, `0.5` is returned.
 *
 * @param interval the bounding interval.
 * @param dates the date/times.
 */
export function toFractions(interval: Interval | ValidInterval, dates: Array<DateTime>) {
    if (null != _.find(dates, date => !interval.contains(date) && !interval.end!.equals(date))) {
        throw Error("Value is not contained within the bounding interval.");
    }
    const length = interval.length("millisecond"),
        start = interval.start!;
    return dates.map(date => start.until(date).length("millisecond") / length);
}

/**
 * Given a bounding interval and array of zero or more split date/times *within* that interval, return an array of
 * numbers representing the fractional length of the sub-intervals when the bounding interval is split at those
 * date/times.
 *
 * @param interval the bounding interval.
 * @param dates the split date/times.
 */
export function toLengthFractions(interval: Interval | ValidInterval, dates: Array<DateTime>) {
    const fractions = toFractions(interval, [
        ...dates,
        ...(0 !== dates.length && dates[dates.length - 1] === interval.end ? [] : [interval.end!])
    ]);
    return _.transform(fractions, (acc, fraction, index, fractions) => {
        if (0 === index) {
            acc.push(fraction);
        } else {
            acc.push(fraction - fractions[index - 1]);
        }
    }, new Array<number>());
}

/**
 * Merge an array of intervals and return an array of {@link DateTime} at which transitions from blocks of time
 * *not contained* in any interval in the original array to blocks of time *contained* in an interval and vice versa.
 *
 * This effectively segments the full period of time covered from the earliest *start* of an interval to the latest
 * *end* of an interval into blocks that were contained versus not contained in any interval.
 *
 * @param intervals the intervals.
 */
export function toTransitions(intervals: Array<Interval | ValidInterval>) {
    if (0 === intervals.length) {
        return new Array<DateTime>();
    }
    const merged = Interval.merge([...intervals]).map(toValidInterval);
    return _.flatten(merged.map(({end, start}) => [start, end] as const));
}

export function toValidInterval(interval: Interval | ValidInterval): ValidInterval {
    if ("isValid" in interval && !interval.isValid) {
        throw Error("Interval is not valid.");
    }
    return interval as ValidInterval;
}

/**
 * {@link LocalDateFormat} provides utilities for formatting date and/or time strings according to a locale and time
 * zone.
 */
export class LocalDateFormat {

    constructor(public readonly locale: string, public readonly timeZone: string) {
    }

    /**
     * Format a date and/or time according to the configured time zone and locale.
     *
     * @param date the date to format.
     * @param parts the parts to include, defaults to date *and* time.
     * @param style the style, defaults to `short`.
     */
    format(date: Date, parts: Array<DateTimePart> = ["date", "time"], style: DateTimeStyle = "short") {
        return this.newDateTimeFormat({
            ...(_.includes(parts, "date") ? {dateStyle: style} : {}),
            ...(_.includes(parts, "time") ? {timeStyle: style} : {})
        }).format(date).replace(/\s/g, " ");
    }

    /**
     * Format a relative date/time range as a simple duration: without any *in* prefix, *ago* suffix, or the like.
     *
     * Note that this makes the assumption that the *unit* part of a formatted relative time (see
     * `Intl.RelativeTimeFormat`) is always followed by the *unit name* in a single part, and formats a string
     * containing only those two units. It's likely this is not correct for all locales.
     *
     * Examples:
     * * `1 day`
     * * `2 weeks`
     *
     * @param range the date range.
     */
    formatRelativeDuration(range: DateRange) {
        const actualRange = range[0] <= range[1] ? range : range.reverse(),
            parts = this.formatToPartsInMinimalUnit(actualRange as DateRange, {numeric: "always"}),
            unitIndex = parts.findIndex(isUnitPart);
        return _.map(parts.slice(unitIndex, unitIndex + 2), "value").join("");
    }

    /**
     * Format a relative date/time range.
     *
     * Examples:
     * * `tomorrow`
     * * `yesterday`
     * * `in 2 weeks`
     * * `1 month ago`
     *
     * @param range the date range.
     */
    formatRelative(range: DateRange) {
        const parts = this.formatToPartsInMinimalUnit(range, {numeric: "auto"});
        return _.map(parts, "value").join("");
    }

    private differenceInMinimalUnit(range: DateRange) {
        const deltaSeconds = Math.round((range[1].getTime() - range[0].getTime()) / 1_000),
            [thresholdSeconds, unit] = _.findLast(relativeUnitThresholds,
                ([thresholdSeconds]) => thresholdSeconds <= Math.abs(deltaSeconds)) || relativeUnitThresholds[0],
            difference = Math.round(deltaSeconds / thresholdSeconds);
        return {difference, unit};
    }

    private formatToPartsInMinimalUnit(range: DateRange, options: Intl.RelativeTimeFormatOptions) {
        const {difference, unit} = this.differenceInMinimalUnit(range),
            format = this.newRelativeTimeFormat(options);
        return format.formatToParts(difference, unit);
    }

    private newRelativeTimeFormat(options: Intl.RelativeTimeFormatOptions) {
        return new Intl.RelativeTimeFormat(this.locale, options);
    }

    private newDateTimeFormat(options: Intl.DateTimeFormatOptions) {
        return new Intl.DateTimeFormat(this.locale, {
            timeZone: this.timeZone,
            ...options
        });
    }

    /**
     * Create a new {@link LocalDateFormat} which will format according to a given locale and time zone.
     *
     * @param locale the locale.
     * @param timeZone the time zone.
     */
    static create(locale: string, timeZone: string) {
        return freeze(new LocalDateFormat(locale, timeZone))
    }
}

function isUnitPart(part: Intl.RelativeTimeFormatPart) {
    return "literal" !== part.type && "unit" in part;
}

/**
 * Thresholds, in seconds, to use when determining the most appropriate unit in which to display a relative time or
 * duration.
 */
const relativeUnitThresholds =
    freeze<Array<[number, DurationUnit & Intl.RelativeTimeFormatUnit]>>([
        [1, "second"],
        [60, "minute"],
        [3600, "hour"],
        [86400, "day"],
        [86400 * 7, "week"],
        [86400 * 30, "month"],
        [86400 * 365, "year"]
    ]);
