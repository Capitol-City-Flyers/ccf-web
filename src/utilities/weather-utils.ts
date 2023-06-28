import _ from "lodash";
import {DateTime, Interval} from "luxon";
import {IAbstractWeatherContainer, ICloud, IMetar, ITAF} from "metar-taf-parser";
import {resolveDayTime} from "./date-utils";

interface CategoryInterval {
    category:
        | "ifr"
        | "lifr"
        | "mvfr"
        | "vfr";
    confidence:
        | "forecast"
        | "observed"
        | number; /* Probability, 0..1 */
    interval: Interval;
    source: IAbstractWeatherContainer;
}

/**
 * Flight category and associated date/time interval.
 */
export interface FlightCategoryInterval {
    category: CategoryInterval["category"];
    interval: Interval;
}

/**
 * Given a TAF and an array of Metars, build an array of flight category intervals. Equivalent to
 * {@link metarFlightCategories} combined with {@link tafFlightCategories} such that Metar-derived categories override
 * TAF-derived from overlapping intervals of time. Metar data is used until the end of the Metar data, then the TAF data
 * is used for the remainder of the period.
 *
 * Note that there is no guarantee that the returned intervals will be continuous; if there is a gap between the metar
 * and TAF data, there will be a corresponding gap in the output.
 *
 * @param reference the reference date/time for interpreting day/time values.
 * @param taf the TAF.
 * @param metars the Metar(s).
 */
export function flightCategories(reference: DateTime, taf: ITAF, metars: IMetar[]) {

    /* Get metar and TAF intervals; find index of first TAF trend which does not end *before* the last metar. */
    const metarIntervals = metarFlightCategories(reference, metars);
    const lastMetar = _.last(metarIntervals);
    const metarEnd = lastMetar.interval.end;
    const tafIntervals = tafFlightCategories(reference, taf);
    const tafSplit = _.findIndex(tafIntervals, ({interval: {end}}) => end >= metarEnd);
    if (-1 !== tafSplit) {

        /* Remove TAF interval(s) that end before the last metar. */
        tafIntervals.splice(0, tafSplit);
        const [firstTaf] = tafIntervals;
        if (firstTaf.interval.start <= lastMetar.interval.end) {

            /* Last metar interval and first TAF interval overlap or abut. */
            if (firstTaf.category === lastMetar.category) {

                /* Same category, merge into one interval. */
                lastMetar.interval = lastMetar.interval.start.until(firstTaf.interval.end);
                tafIntervals.splice(0, 1);
            } else {

                /* Different categories, split, remove the last metar if its length is zero. */
                firstTaf.interval = lastMetar.interval.end.until(firstTaf.interval.end);
                if (0 === lastMetar.interval.length()) {
                    metarIntervals.splice(metarIntervals.length - 1, 1);
                }
            }
        }
    }
    return [...metarIntervals, ...tafIntervals];
}

/**
 * Given a list of Metar entries, determine the flight category for each interval and return the results as an array of
 * {@link FlightCategoryInterval}. The returned array will contain one entry per *distinct* flight category interval; in
 * other words, multiple adjacent intervals with the same flight category will be merged into one interval. The result
 * is sorted from *earliest* to *latest* interval. The input Metar array need not be sorted.
 *
 * @param reference the reference date/time for interpreting day/time values.
 * @param metars the Metar(s).
 */
export function metarFlightCategories(reference: DateTime, ...metars: Array<IMetar | Array<IMetar>>) {
    return _.transform(_.sortBy(_.flatten(metars).map(entry =>
            [entry, resolveDayTime(reference, entry.day, entry.hour, entry.minute)] as const), 1),
        (acc, [entry, time]) => {

            /* Remove any preceding zero-length intervals. */
            while (!_.isEmpty(acc)) {
                const {interval: {start}} = _.last(acc);
                if (!time.equals(start)) {
                    break;
                }
                acc.splice(acc.length - 1, 1);
            }

            /* Extend previous interval; begin a new interval if category has changed. */
            const previous = _.last(acc);
            if (null != previous) {
                previous.interval = previous.interval.start.until(time);
            }
            const category = flightCategory(entry);
            if (category !== previous?.category) {
                acc.push({
                    interval: time.until(time),
                    category
                });
            }
        }, new Array<FlightCategoryInterval>());
}

export function tafCategories(reference: DateTime, taf: ITAF) {
    const {clouds, trends, validity: {endDay, endHour, startDay, startHour}, visibility} = taf;
    const category = flightCategory(taf);
    const period = resolveDayTime(reference, startDay, startHour).until(resolveDayTime(reference, endDay, endHour));
    let baseClouds = clouds;
    let baseVisibility = visibility;
    return _.transform(trends, (acc, trend) => {

        /* If the trend does not include cloud or visibility, inherit from preceding trend(s). */
        const haveTrendClouds = !_.isEmpty(trend.clouds);
        const haveTrendVisibility = null != trend.visibility;
        const category = flightCategory(_.defaults({}, trend, {
            clouds: haveTrendClouds ? trend.clouds : baseClouds,
            visibility: haveTrendVisibility ? trend.visibility : baseVisibility
        }));

        /* Add category for this interval. */
        const {validity} = trend;
        const start = resolveDayTime(reference, validity.startDay, validity.startHour);
        acc.push({
            category,
            confidence: null == trend.probability ? "forecast" : trend.probability / 100,
            interval: "endDay" in validity
                ? start.until(resolveDayTime(reference, validity.endDay, validity.endHour))
                : start.until(period.end),
            source: trend
        });
    }, new Array<CategoryInterval>({
        category,
        confidence: "forecast",
        interval: period,
        source: taf
    }));
}

/**
 * Given a TAF entry, determine the flight category for each interval and return the results as an array of
 * {@link FlightCategoryInterval}. The returned array will contain one entry per *distinct* flight category interval; in
 * other words, multiple adjacent intervals with the same flight category will be merged into one interval. The result
 * is sorted from *earliest* to *latest* interval.
 *
 * @param reference the reference date/time for interpreting day/time values.
 * @param taf the TAF.
 */
export function tafFlightCategories(reference: DateTime, taf: ITAF) {
    const {clouds, trends, validity: {endDay, endHour, startDay, startHour}, visibility} = taf;
    const category = flightCategory(taf);
    const interval = resolveDayTime(reference, startDay, startHour).until(resolveDayTime(reference, endDay, endHour));
    let baseClouds = clouds;
    let baseVisibility = visibility;
    return _.transform(trends, (acc, trend) => {

        /* Get clouds and visibility, possibly inheriting from preceding persistent trend. */
        const haveTrendClouds = !_.isEmpty(trend.clouds);
        const haveTrendVisibility = null != trend.visibility;
        const trendClouds = haveTrendClouds ? trend.clouds : baseClouds;
        const trendVisibility = haveTrendVisibility ? trend.visibility : baseVisibility;

        /* Get effective flight category, determine whether it has changed since previous trend. */
        const previous = _.last(acc);
        const category = flightCategory(_.defaults({}, trend, {
            clouds: trendClouds,
            visibility: trendVisibility
        }));
        const {validity} = trend;
        const end = resolveDayTime(reference, validity.endDay, validity.endHour);
        if (category !== previous?.category) {
            const start = resolveDayTime(reference, validity.startDay, validity.startHour, validity.startMinutes);
            if (!("endDay" in validity)) {
                acc.push({
                    category,
                    interval: start.until(previous.interval.end)
                });
            } else {
                acc.push({
                    category,
                    interval: start.until(end)
                }, {
                    category: previous.category,
                    interval: end.until(previous.interval.end)
                });
            }
        }

        /* Update base clouds and/or visibility for persistent trends. */
        if ("FM" === trend.type || "BECMG" === trend.type) {
            if (haveTrendClouds) {
                baseClouds = trend.clouds;
            }
            if (haveTrendVisibility) {
                baseVisibility = trend.visibility;
            }
        }
    }, new Array<FlightCategoryInterval>({category, interval}));
}

/**
 * Determine the US/FAA flight category which corresponds to a given array of cloud layers and visibility.
 *
 * @param weather the weather.
 */
function flightCategory(weather: IAbstractWeatherContainer): CategoryInterval["category"] {
    if (true === weather.cavok) {
        return "vfr";
    }
    const {clouds, visibility} = weather;
    const visibilitySM = visibility.value * ("SM" === visibility.unit ? 1 : 1609.34);
    const ceiling = clouds.find(isCeiling)?.height || Infinity;
    if (ceiling < 500 || visibilitySM < 1) {
        return "lifr";
    } else if (ceiling < 1000 || visibilitySM < 3) {
        return "ifr";
    } else if (ceiling < 3000 || visibilitySM < 5) {
        return "mvfr";
    }
    return "vfr";
}

/**
 * Determine whether a cloud layer is considered a ceiling (broken or overcast; 5-8 octas.)
 *
 * @param quantity the cloud layer quantity.
 */
function isCeiling({quantity}: ICloud) {
    return "BKN" === quantity || "OVC" === quantity;
}
