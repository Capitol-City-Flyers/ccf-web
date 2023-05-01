import React, {useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {Interval} from "luxon";
import {useLocalDateTime} from "../../../../context/AppContext";
import {toLengthFractions, toPercentagesOfInterval} from "../../../../utils/DateUtils";
import {AvailabilityState} from "./AvailabilityState";
import {SolarIntervals} from "../../../../utils/DateCalc";
import {AvailabilityTimeline} from "./AvailabilityTimeline";
import {toPercent} from "../../../../utils/MathUtils";

interface AvailabilityGridProps {
    availability: AvailabilityState["availability"];
    interval: Interval;
}

export function AvailabilityGrid({availability, interval}: AvailabilityGridProps) {
    const {dateCalc} = useLocalDateTime(),
        solarSpans = useMemo(() => {
            const intervals = dateCalc.solarIntervals(interval.start!, {
                latitude: 43.2869331,
                longitude: -89.7240116
            });
            return intervalSpans(intervals);
        }, [dateCalc, interval.start!.toMillis()]),
        sortedAvailability = useMemo(() =>
                _.sortBy(availability, ({aircraft: {tailNumber}}) => tailNumber),
            [availability, interval.start!.toMillis(), interval.end!.toMillis()]);
    return (
        <div className="av-grid drop-shadow-md mt-3" style={{backgroundImage: daylightGradient(solarSpans)}}>
            <div className="annotations flight-category">
                <span className="low-ifr" style={{width: "25%"}}>&nbsp;</span>
                <span className="ifr" style={{width: "25%"}}>&nbsp;</span>
                <span className="marginal-vfr" style={{width: "25%"}}>&nbsp;</span>
                <span className="vfr" style={{width: "25%"}}>&nbsp;</span>
            </div>
            {sortedAvailability.map((availability, index) => (
                <AvailabilityTimeline key={`availability[${index}]`} {...availability}/>
            ))}
            <div className="annotations time-of-day">
                {solarSpans.map(({width}, index) => (
                    <span key={`solarInterval[${index}]`}
                          className={intervalClassesAndColors[index][0]}
                          style={{width: `${width}%`}}>
                        &nbsp;
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Generate the background gradient which indicates night, civil twilight, etc.
 *
 * @param spans the raw solar interval data.
 */
function daylightGradient(spans: Array<IntervalSpan>) {
    const steps = spans.slice(1).reduce((acc, {start}, index) => {
        const oldColor = intervalClassesAndColors[index][1],
            newColor = intervalClassesAndColors[index + 1][1];
        return `${acc}, ${oldColor} ${start}%, ${newColor} ${start}%`;
    }, "");
    return `linear-gradient(to right, ${intervalClassesAndColors[0][1]} ${steps})`;
}

function intervalSpans(solarIntervals: SolarIntervals) {
    const times = [
            solarIntervals.daylight.start!.minus({hour: 1}),
            solarIntervals.morningCivilTwilight.start!,
            solarIntervals.daylight.start!,
            solarIntervals.daylight.end!,
            solarIntervals.eveningCivilTwilight.end!,
            solarIntervals.daylight.end!.plus({hour: 1})
        ],
        day = solarIntervals.day,
        spanIntervals = _.zip([day.start!, ...times], [...times, day.end!])
            .map(([start, end]) => start!.until(end!)),
        spanWidths = toLengthFractions(day, times).map(toPercent);
    return _.transform(_.zip(spanIntervals, spanWidths),
        (acc, [interval, percent], index) => {
            acc.push({
                interval: interval!,
                start: 0 === index ? 0 : acc[index - 1].start + acc[index - 1].width,
                width: percent!
            });
        }, new Array<IntervalSpan>());
}

/**
 * Interval and its *start* and *width* within an interval span, expressed as percentages within a container.
 */
interface IntervalSpan {
    interval: Interval;
    start: number;
    width: number;
}

const intervalClassesAndColors = freeze([
    ["night", "var(--solar-interval-night-color)"],
    ["hour-from-daylight", "var(--solar-interval-hour-from-daylight-color)"],
    ["civil-twilight", "var(--solar-interval-civil-twilight-color)"],
    ["day", "var(--solar-interval-day-color)"],
    ["civil-twilight", "var(--solar-interval-civil-twilight-color)"],
    ["hour-from-daylight", "var(--solar-interval-hour-from-daylight-color)"],
    ["night", "var(--solar-interval-night-color)"]
] as const, true);
