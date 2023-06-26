import _ from "lodash";
import {DateTime, Interval} from "luxon";
import {Distance, ICloud, IMetar, ITAF} from "metar-taf-parser";
import {resolveDayTime} from "./date-utils";

/**
 * Given a TAF and an array of Metars, build an array of flight category intervals. Equivalent to
 * {@link metarFlightCategories} combined with {@link tafFlightCategories} such that Metar-derived categories override
 * TAF-derived from overlapping intervals of time. Metar data is used until the end of the Metar data, then the TAF data
 * is used for the remainder of the period.
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
    const tafSplit = _.findIndex(tafIntervals, ({interval: {end}}) => end > metarEnd);
    if (-1 !== tafSplit) {

        /* Remove TAFs which end before the last metar. Set transition depending upon whether category changed. */
        tafIntervals.splice(0, tafSplit);
        const [firstTaf] = tafIntervals;
        if (firstTaf.category === lastMetar.category) {
            lastMetar.interval = lastMetar.interval.start.until(firstTaf.interval.end);
            tafIntervals.splice(0, 1);
        } else {
            firstTaf.interval = lastMetar.interval.end.until(firstTaf.interval.end);
            if (0 === lastMetar.interval.length()) {
                metarIntervals.splice(metarIntervals.length - 1, 1);
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
            const category = flightCategory(entry.clouds, entry.visibility);
            if (category !== previous?.category) {
                acc.push({
                    interval: time.until(time),
                    category
                });
            }
        }, new Array<FlightCategoryInterval>());
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
    const category = flightCategory(clouds, visibility);
    const interval = resolveDayTime(reference, startDay, startHour).until(resolveDayTime(reference, endDay, endHour));
    return _.transform(trends, (acc, trend) => {
        const previous = _.last(acc);
        const category = flightCategory(trend.clouds, trend.visibility);
        if (category !== previous?.category) {
            const {validity} = trend;
            const start = resolveDayTime(reference, validity.startDay, validity.startHour, validity.startMinutes);
            if (!("endDay" in validity)) {
                acc.push({
                    interval: start.until(previous.interval.end),
                    category
                });
            } else {
                const end = resolveDayTime(reference, validity.endDay, validity.endHour);
                acc.push({
                    interval: start.until(end),
                    category
                }, {
                    interval: end.until(previous.interval.end),
                    category: previous.category
                });
            }
            previous.interval = previous.interval.start.until(start);
        }
    }, new Array<FlightCategoryInterval>({category, interval})).filter(isNotEmptyInterval);
}

/**
 * Determine the US/FAA flight category which corresponds to a given array of cloud layers and visibility.
 *
 * @param clouds the cloud layers.
 * @param visibility the visibility.
 */
function flightCategory(clouds: ICloud[], visibility: Distance) {
    const visibilitySM = visibility.value * ("SM" === visibility.unit ? 1 : 1609.34);
    const ceiling = clouds.find(isCeiling)?.height || Infinity;
    if (ceiling < 500 || visibilitySM < 1) {
        return "LIFR";
    } else if (ceiling < 1000 || visibilitySM < 3) {
        return "IFR";
    } else if (ceiling < 3000 || visibilitySM < 5) {
        return "MVFR";
    }
    return "VFR";
}

/**
 * Determine whether a cloud layer is considered a ceiling (broken or overcast; 5-8 octas.)
 *
 * @param quantity the cloud layer quantity.
 */
function isCeiling({quantity}: ICloud) {
    return "BKN" === quantity || "OVC" === quantity;
}

function isNotEmptyInterval({interval}: FlightCategoryInterval) {
    return interval.length() > 0;
}

/**
 * Flight category and associated date/time interval.
 */
interface FlightCategoryInterval {
    category:
        | "LIFR"
        | "IFR"
        | "MVFR"
        | "VFR";
    interval: Interval;
}
