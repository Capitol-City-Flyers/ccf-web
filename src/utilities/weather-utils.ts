import _ from "lodash";
import {DateTime, Interval} from "luxon";
import {Distance, ICloud, IMetar, ITAF} from "metar-taf-parser";
import {resolveDayTime} from "./date-utils";

/**
 * Determine the US/FAA flight category which corresponds to a given array of cloud layers and visibility.
 *
 * @param clouds the cloud layers.
 * @param visibility the visibility.
 */
export function flightCategory(clouds: ICloud[], visibility: Distance) {
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
            const category = flightCategory(entry.clouds, entry.visibility);
            const previous = _.last(acc);
            if (category === previous?.category) {
                previous.interval = previous.interval.start.until(time);
            } else {
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
    return _.transform(taf.trends, (acc, trend) => {
        const category = flightCategory(trend.clouds, trend.visibility);
        const previous = _.last(acc);
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
    }, new Array<FlightCategoryInterval>({category, interval}));
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
