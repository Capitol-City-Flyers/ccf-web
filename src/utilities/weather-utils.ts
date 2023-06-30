import _ from "lodash";
import {DateTime, Interval} from "luxon";
import {
    DistanceUnit,
    IAbstractWeatherContainer,
    ICloud,
    IMetar,
    ITAF,
    TAFTrend,
    WeatherChangeType
} from "metar-taf-parser";
import {resolveDayTime} from "./date-utils";
import {FlightCategory, FlightCategoryInterval, FlightConditions} from "./weather-types";

/**
 * Determine flight category (VFR, MVFR, IFR, LIFR) intervals from an array of Metars. The array is assumed to be
 * contiguous: each entry is assumed to extend to the start of the *subsequent* entry. Entries need not be sorted.
 *
 * Adjacent intervals of the same flight category are collapsed to a single interval. One entry will be present in the
 * output array per *change* in flight category.
 *
 * @param reference the reference date/time.
 * @param metars the Metar entries.
 * @return CategoryInterval[]
 */
export function metarFlightCategories(reference: DateTime, metars: IMetar[]) {
    const sorted = _.sortBy(metars.map(metar =>
        [resolveDayTime(reference, metar.day, metar.hour, metar.minute), metar] as const, 0));
    const lastIndex = sorted.length - 1;
    const period = sorted[0][0].until(sorted[lastIndex][0]);
    const intervals = conditionIntervals(period, _.map(sorted, ([start, metar], index) => {
        if (index < lastIndex) {
            return [start.until(sorted[index + 1][0]), metar];
        }
        return [start, metar];
    }));
    return categoryIntervals(intervals, usFlightCategory);
}

/**
 * Determine flight category (VFR, MVFR, IFR, LIFR) intervals from a TAF.
 *
 * Adjacent intervals of the same flight category are collapsed to a single interval. One entry will be present in the
 * output array per *change* in flight category.
 *
 * @param reference the reference date/time.
 * @param taf the TAF.
 * @return CategoryInterval[]
 */
export function tafFlightCategories(reference: DateTime, taf: ITAF) {
    const {validity: {endDay, endHour, startDay, startHour}} = taf;
    const period = resolveDayTime(reference, startDay, startHour).until(resolveDayTime(reference, endDay, endHour));
    const intervals = conditionIntervals(period, [taf, ...taf.trends].map(trend => {
        const {validity} = trend;
        const start = resolveDayTime(reference, validity.startDay, validity.startHour);
        if ("endDay" in trend.validity) {
            return [start.until(resolveDayTime(reference, validity.endDay, validity.endHour)), trend];
        }
        return [start, trend];
    }));
    return categoryIntervals(intervals, usFlightCategory);
}

/**
 * Build an array of {@link FlightCategoryInterval} records from a raw array of interval and {@link FlightConditions}
 * tuples. Category for each interval is determined via a `rules()` function and adjacent intervals which resolve to the
 * same category are collapsed into a single interval; one entry is present in the returned array per *change* in flight
 * category.
 *
 * @param intervals the intervals.
 * @param rules the flight category lookup function.
 * @return CategoryInterval[]
 */
function categoryIntervals(intervals: [Interval, FlightConditions][], rules: FlightCategoryRules) {
    return _.transform(intervals, (acc, [interval, condition]) => {
        const category = rules(condition);
        const {weather} = condition;
        const previous = _.last(acc);
        if (category === previous?.category) {

            /* Same category; extend prior interval. */
            previous.interval = previous.interval.start.until(interval.end);
            previous.conditions.push({condition, interval, weather});
        } else {

            /* Different category; begin a new interval. */
            acc.push({
                conditions: [{condition, interval, weather}],
                category, interval
            });
        }
    }, new Array<FlightCategoryInterval>());
}

/**
 * Given an array of weather intervals over some period, normalize to an array of non-overlapping intervals of ceiling
 * and/or visibility. Where appropriate, ceiling and/or visibility are inherited from preceding intervals.
 *
 * @param period the complete period covered by the intervals.
 * @param intervals the weather intervals.
 * @return [Interval, FlightCondition][]
 */
function conditionIntervals(period: Interval, intervals: IntervalWeather[]) {
    const periodEnd = period.end;
    return _.transform(intervals, (acc, [validity, weather], index) => {
        const interval = validity instanceof Interval ? validity : validity.until(periodEnd);
        let ceiling = weather.clouds.find(isCeiling);
        let visibility = weather.visibility;
        if (0 === index) {
            acc.push([interval, {
                weather,
                ...(ceiling && {ceiling}),
                ...(visibility && {visibility})
            }]);
        } else {

            /* Find overlapping intervals; suspend all, copy those which extend past this for resumption. */
            const preceding = acc.filter(([{end}]) => end > interval.start);
            const succeeding: [Interval, FlightConditions][] = (!isBoundedTafTrend(weather) ? [] : preceding)
                .filter(([{end}]) => end > interval.end)
                .map(([{end}, conditions]) => [interval.end.until(end), conditions]);
            if (!_.isEmpty(preceding)) {
                preceding.forEach(next => next[0] = next[0].start.until(interval.start));
                if ((null == ceiling || null == visibility)) {

                    /* Inherit ceiling and/or visibility from previous interval. */
                    const [, previous] = _.last(preceding);
                    if (null == ceiling) {
                        ceiling = previous.ceiling;
                    }
                    if (null == visibility) {
                        visibility = previous.visibility;
                    }
                }
            }

            /* Push the next interval and any which will be resumed. */
            acc.push([interval, {
                weather,
                ...(ceiling && {ceiling}),
                ...(visibility && {visibility})
            }], ...succeeding);
        }
    }, new Array<[Interval, FlightConditions]>());
}

/**
 * Determine the US/FAA flight category which corresponds to a given array of cloud layers and visibility.
 *
 * @param condition the flight condition.
 */
function usFlightCategory(condition: FlightConditions): FlightCategory {
    const {ceiling, visibility} = condition;
    const ceilingFeet = null != ceiling?.height ? ceiling.height : Infinity;
    const visibilitySM = visibility.value * (DistanceUnit.StatuteMiles === visibility.unit ? 1 : 1609.34);
    if (ceilingFeet <= 500 || visibilitySM < 1) {
        return "lifr";
    } else if (ceilingFeet <= 1000 || visibilitySM < 3) {
        return "ifr";
    } else if (ceilingFeet <= 3000 || visibilitySM < 5) {
        return "mvfr";
    }
    return "vfr";
}

/**
 * Function which determines the {@link FlightCategory} for a set of flight conditions.
 */
type FlightCategoryRules = (conditions: FlightConditions) => FlightCategory;

/**
 * Weather applying to an interval.
 */
type IntervalWeather = [

    /**
     * Interval or start date/time.
     */
    validity: DateTime | Interval,

    /**
     * Weather conditions.
     */
    weather: IAbstractWeatherContainer
];

/**
 * Type guard for a {@link TAFTrend} which is of a *bounded* type (type with a defined start *and* end.) Matches a
 * {@link WeatherChangeType.INTER} or {@link WeatherChangeType.TEMPO} trend.
 *
 * @param value the value to check.
 */
function isBoundedTafTrend(value: any): value is TAFTrend {
    return isTafTrend(value) && -1 !== ["INTER", "TEMPO"].indexOf(value.type);
}

/**
 * Determine whether a cloud layer is considered a ceiling (broken or overcast; 5-8 octas.)
 *
 * @param quantity the cloud layer quantity.
 */
function isCeiling({quantity}: ICloud) {
    return "BKN" === quantity || "OVC" === quantity;
}

/**
 * Type guard for {@link TAFTrend}.
 *
 * @param value the value to check.
 */
function isTafTrend(value: any): value is TAFTrend {
    return _.isObject(value)
        && "type" in value
        && _.isString(value.type)
        && -1 !== Object.keys(WeatherChangeType).indexOf(value.type);
}
