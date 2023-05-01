import {freeze} from "immer";
import _ from "lodash";
import {DateTime, DateTimeUnit, DurationLike, DurationUnit, Interval} from "luxon";
import SunCalc, {GetTimesResult} from "suncalc";
import {GeoCoordinates} from "../types/FlightsTypes";

/**
 * Solar time intervals in a day. Note that *night* is everything outside of these intervals (midnight to the start of
 * {@link morningAstronomicalTwilight} and the end of {@link eveningAstronomicalTwilight} to the following midnight.)
 */
export interface SolarIntervals {

    /**
     * Full day, midnight to midnight.
     */
    day: Interval;

    /**
     * Daylight, sunrise to sunset.
     */
    daylight: Interval;
    eveningAstronomicalTwilight: Interval;
    eveningCivilTwilight: Interval;
    eveningNauticalTwilight: Interval;
    morningAstronomicalTwilight: Interval;
    morningCivilTwilight: Interval;
    morningNauticalTwilight: Interval;
}

/**
 * Logical date windows.
 */
export const DATE_WINDOWS = freeze([
    "current day",
    "current month",
    "current week",
    "current weekend",
    "next day",
    "next month",
    "next week",
    "next weekend",
    "previous day",
    "previous month",
    "previous week",
    "previous weekend"
] as const);

/**
 * Selectable date windows for items such as schedules and availability timelines.
 *
 * **Regarding weekends:** since a given date/time may or may not be in a weekend, the *weekend* windows are interpreted
 * as "the weekend portion of the [current|next|previous] week." In other words, the *current weekend* on a Friday is
 * the immediate following Saturday and Sunday; on a Saturday, it's that Saturday and the immediately following Sunday.
 */
export type DateWindow =
    | Interval
    | typeof DATE_WINDOWS[number];

/**
 * {@link DateCalc} provides utilities related to date calculations with reference to a particular time zone.
 */
export class DateCalc {
    private readonly dateTimeOpts: { zone: string };
    private readonly firstDayOfWeekAdjustment: DurationLike;

    private constructor(public readonly timeZone: string) {
        this.dateTimeOpts = freeze({zone: timeZone});
        this.firstDayOfWeekAdjustment = freeze({day: -1});
    }

    allOf(count: number, unit: DurationUnit & DateTimeUnit, reference?: DateTime) {
        if (count < 1) {
            throw Error("Invalid unit count.");
        }
        const remainder = this.remainderOf(count, unit, reference),
            end = remainder.end!;
        return Interval.fromDateTimes(end.minus({[unit]: count}), end);
    }

    now() {
        return DateTime.local(this.dateTimeOpts);
    }

    remainderOf(count: number, unit: DurationUnit & DateTimeUnit, reference?: DateTime): Interval {
        if (count < 1) {
            throw Error("Invalid unit count.");
        }
        const start = reference?.setZone(this.timeZone) || this.now();
        let end = start.plus({[unit]: count}).startOf(unit);
        if ("week" === unit) {
            end = end.plus(this.firstDayOfWeekAdjustment);
        }
        return Interval.fromDateTimes(start, end);
    }

    /**
     * Resolve a date window to a concrete interval.
     *
     * @param window the window to resolve.
     * @param reference the reference date/time for resolving relative windows (default is *now.*)
     */
    resolve(window: DateWindow, reference?: DateTime) {
        if (window instanceof Interval) {
            return window;
        }
        const ref = reference?.setZone(this.timeZone) || this.now();
        switch (window) {
            case "current day": {
                const start = ref.startOf("day");
                return start.until(start.plus({day: 1}));
            }
            case "current month": {
                const start = ref.startOf("month");
                return start.until(start.plus({month: 1}));
            }
            case "current week": {
                const start = ref.startOf("week").plus(this.firstDayOfWeekAdjustment);
                return start.until(start.plus({week: 1}));
            }
            case "current weekend": {
                const start = ref.startOf("week").plus({day: 5});
                return start.until(start.plus({day: 2}));
            }
            case "previous day": {
                const start = ref.minus({day: 1}).startOf("day");
                return start.until(start.plus({day: 1}));
            }
            case "previous month": {
                const end = ref.startOf("month");
                return end.minus({month: 1}).until(end);
            }
            case "previous week": {
                const {firstDayOfWeekAdjustment} = this,
                    end = ref.minus(firstDayOfWeekAdjustment)
                        .startOf("week")
                        .plus(firstDayOfWeekAdjustment);
                return end.minus({week: 1}).until(end);
            }
            case "previous weekend": {
                const end = ref.startOf("week");
                return end.minus({day: 2}).until(end);
            }
            case "next day": {
                const start = ref.plus({day: 1}).startOf("day");
                return start.until(start.plus({day: 1}));
            }
            case "next month": {
                const start = ref.startOf("month").plus({month: 1});
                return start.until(start.plus({month: 1}));
            }
            case "next week": {
                const start = ref.startOf("week")
                    .plus({week: 1})
                    .plus(this.firstDayOfWeekAdjustment);
                return start.until(start.plus({week: 1}));
            }
            case "next weekend": {
                const start = ref.startOf("week").plus({day: 5});
                return start.until(start.plus({day: 2}));
            }
        }
    }

    /**
     * Get a {@link SolarIntervals} describing all solar time intervals for a given date.
     *
     * @param date the date.
     * @param coords the geographical coordinates.
     */
    solarIntervals(date: DateTime, coords: GeoCoordinates) {
        const startOfDay = date.startOf("day"),
            startOfDayAtLongitude = adjustForLongitude(startOfDay, coords.longitude),
            times = SunCalc.getTimes(startOfDayAtLongitude.toJSDate(), coords.latitude, coords.longitude),
            day = Interval.fromDateTimes(startOfDay, startOfDay.plus({day: 1}).startOf("day")),
            intervals = _.mapValues(sunCalcTimesByTimeOfDay, ([start, end]) =>
                Interval.fromDateTimes(
                    DateTime.fromJSDate(times[start], this.dateTimeOpts),
                    DateTime.fromJSDate(times[end], this.dateTimeOpts)
                ));
        return freeze<SolarIntervals>({...intervals, day});
    }

    /**
     * Convert a {@link Date} object to a {@link DateTime} in the configured time zone.
     *
     * @param date the date to convert.
     */
    toDateTime(date: Date): DateTime;

    /**
     * Convert an ISO date/time string to a {@link DateTime} in the configured time zone.
     *
     * @param iso the date/time string to convert.
     */
    toDateTime(iso: string): DateTime;

    /**
     * Convert a Unix epoch millisecond value to a {@link DateTime} in the configured time zone.
     *
     * @param millis the Unix epoch millisecond value.
     */
    toDateTime(millis: number): DateTime;

    toDateTime(dateIsoOrMillis: Date | number | string) {
        if (_.isString(dateIsoOrMillis)) {
            return DateTime.fromISO(dateIsoOrMillis, this.dateTimeOpts);
        } else if (_.isNumber(dateIsoOrMillis)) {
            return DateTime.fromMillis(dateIsoOrMillis, this.dateTimeOpts);
        }
        return DateTime.fromJSDate(dateIsoOrMillis, this.dateTimeOpts);
    }

    /**
     * Create a new {@link DateCalc} which will perform calculations according to a given time zone.
     *
     * @param timeZone the time zone.
     */
    static create(timeZone: string) {
        return freeze(new DateCalc(timeZone));
    }
}

/**
 * Adjust a date/time to ensure that {@link SunCalc.getTimes} retrieves data for the correct day (rather than the day
 * before.) Necessary because SunCalc is not aware of time zones and uses degrees longitude alone to determine date,
 * this adjusts for the difference.
 *
 * @param date the date to adjust.
 * @param longitude the longitude coordinate.
 */
function adjustForLongitude(date: DateTime, longitude: number) {
    const adjustment = 0.5 + -longitude + (date.offset / 4);
    return date.plus({hour: adjustment / 15});
}

/**
 * Map of {@link SolarIntervals} property names to the corresponding {@link SunCalc} *start* and *end* time keys.
 */
const sunCalcTimesByTimeOfDay: Omit<{ [k in keyof SolarIntervals]: [keyof GetTimesResult, keyof GetTimesResult] }, "day"> =
    freeze({
        morningAstronomicalTwilight: ["nightEnd", "nauticalDawn"],
        morningNauticalTwilight: ["nauticalDawn", "dawn"],
        morningCivilTwilight: ["dawn", "sunrise"],
        daylight: ["sunrise", "sunset"],
        eveningCivilTwilight: ["sunset", "dusk"],
        eveningNauticalTwilight: ["dusk", "nauticalDusk"],
        eveningAstronomicalTwilight: ["nauticalDusk", "night"]
    });
