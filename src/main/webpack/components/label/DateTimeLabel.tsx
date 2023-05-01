import React, {useMemo} from "react";
import _, {capitalize} from "lodash";
import {freeze} from "immer";

/**
 * Properties for a {@link DateTimeLabel} component.
 */
type DateTimeLabelProps =
    | ActualDateTimeLabelProps
    | RelativeDateTimeLabelProps;

/**
 * Properties for a {@link DateTimeLabel} component when an actual date and/or time value is to be displayed.
 */
interface ActualDateTimeLabelProps {
    capitalize?: true;
    date?: true;
    time?: true;
    value: Date | number | string;
}

/**
 * Properties for a {@link DateTimeLabel} component when a relative date or time value is to be displayed (*tomorrow*,
 * *2 weeks ago*, *in 3 months*, etc.)
 */
interface RelativeDateTimeLabelProps {
    capitalize?: true;

    /**
     * Express the duration as a simple difference, without "in" prefix or "ago" suffix or the like.
     */
    difference?: true;
    relative: true;
    from?: Date | number | string;
    value: Date | number | string;
}

/**
 * {@link DateTimeLabel} produces a `<span>...</span>` containing either a *literal* or *relative* date and/or time
 * string. Values are always formatted according to the browser locale settings.
 *
 * @param value the value to format.
 * @param rest the formatting options.
 * @constructor
 */
export function DateTimeLabel({value, ...rest}: DateTimeLabelProps) {
    const from = useMemo(() => "from" in rest && rest.from ? toDate(rest.from) : new Date(), ["from" in rest && rest.from]),
        formatter = useMemo<(value: Date) => string>(() => {
            const capitalize = "capitalize" in rest;
            if (!("relative" in rest)) {

                /* Formatting a literal date and/or time. */
                let options: Intl.DateTimeFormatOptions;
                if (!("date" in rest || "time" in rest)) {
                    options = {
                        dateStyle: "short",
                        timeStyle: "short"
                    };
                } else {
                    options = {
                        ...("date" in rest ? {dateStyle: "short"} : {}),
                        ...("time" in rest ? {timeStyle: "short"} : {})
                    }
                }
                const formatter = new Intl.DateTimeFormat("default", options);
                return value => {
                    const formatted = formatter.format(value);
                    return capitalize ? _.capitalize(formatted) : formatted;
                }
            }

            /* Formatting a relative date or time ("tomorrow," "in 10 days," etc.) */
            const format = new Intl.RelativeTimeFormat("default", {
                    numeric: "difference" in rest ? "always" : "auto"
                }),
                fromMillis = from.getTime();
            return value => {
                const valueMillis = toDate(value).getTime(),
                    delta = Math.round((valueMillis - fromMillis) / 1000),
                    [divisor, unit] = _.findLast(relativeUnits,
                        ([cutoff]) => cutoff <= Math.abs(delta))!,
                    units = Math.floor(delta / divisor);
                if (!("difference" in rest)) {

                    /* "difference" is not set: "in 10 days." */
                    const formatted = format.format(units, unit);
                    return capitalize ? _.capitalize(formatted) : formatted;
                }

                /* "difference" is set: "10 days." Note that this is arbitrary, I'm just finding the "unit" part and
                grabbing it and its following part, which may not be correct in every locale...? */
                const parts = format.formatToParts(units, unit),
                    unitIndex = parts.findIndex(next => "unit" in next),
                    formatted = _.map(parts.slice(unitIndex, unitIndex + 2), "value").join("");
                return capitalize ? _.capitalize(formatted) : formatted;
            }
        }, [from, ...Object.values(_.pick(rest, "capitalize", "date", "difference", "time", "relative"))]),
        formatted = useMemo(() => formatter(toDate(value)), [formatter, value]);
    return (<>{formatted}</>);
}

/**
 * Pairs of cutoffs, in seconds, to corresponding relative time units to use when formatting a relative date or time.
 */
const relativeUnits =
    freeze<Array<[number, Intl.RelativeTimeFormatUnit]>>([
        [1, "second"],
        [60, "minute"],
        [3600, "hour"],
        [86400, "day"],
        [86400 * 7, "week"],
        [86400 * 30, "month"],
        [86400 * 365, "year"]
    ]);

/**
 * Convert a {@link Date}, `number` in epoch milliseconds, or `string` ISO date/time into a {@link Date}.
 *
 * @param value the value to convert.
 */
function toDate(value: Date | number | string) {
    if (value instanceof Date) {
        return value;
    }
    return new Date(value);
}
