import {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {DateTime, Interval} from "luxon";
import colors from "tailwindcss/colors";
import {GeoCoordinates} from "../../navigation/navigation-types";
import {useDateCalc} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import {toLengthFractions, truncate} from "../../utilities/date-utils";
import {percent} from "../../utilities/math-utils";
import {SolarIntervals} from "../../utilities/DateCalc";

/**
 * Properties for a {@link DaySegmentsPanel} component.
 */
interface DaySegmentsPanelProps {

    /**
     * Date for which solar intervals are to be displayed.
     */
    date:
        | DateTime
        | ReturnType<DateTime["toISODate"]>;

    /**
     * Geographic position for which to display solar intervals.
     */
    position: GeoCoordinates;
}

/**
 * {@link DaySegmentsPanel} produces a `<div />` with background color columns which correspond to the day/night
 * segments of a given day:
 * * AM night
 * * Hour before sunrise
 * * Morning civil twilight
 * * Daylight
 * * Evening civil twilight
 * * Hour after sunset
 * * PM night
 *
 * @param props the component properties.
 * @constructor
 */
export default function DaySegmentsPanel(props: PropsWithChildren<DaySegmentsPanelProps>) {
    const {children, date, position} = props,
        dateCalc = useDateCalc(),
        messages = useMessages(),
        segments = useMemo(() => {
            const dateTime = _.isString(date) ? DateTime.fromISO(date) : date,
                baseSegments = solarSegments(dateCalc.solarIntervals(dateTime, position));
            return baseSegments.map((segment, index) => ({
                tooltip: messages.resolve(
                    segmentColorsAndTooltipKeys[index][1],
                    segment.interval.start.toLocaleString(DateTime.TIME_SIMPLE),
                    segment.interval.end.toLocaleString(DateTime.TIME_SIMPLE),
                    segment.interval.toLocaleString(DateTime.TIME_SIMPLE),
                    truncate(segment.interval.toDuration(), "minutes").toHuman()),
                ...segment
            }));
        }, [dateCalc, messages, position.latitude, position.longitude, _.isString(date) ? date : date.toMillis()]),
        gradient = useMemo(() => daylightGradient(segments), [segments]);
    return (
        <div className="drop-shadow-md" style={{backgroundImage: gradient}}>
            <div className="cursor-pointer h-3">
                {segments.map(({tooltip, width}, index) => (
                    <div key={`segment${index}`}
                         className="border-2 border-transparent h-3 inline-block tooltip hover:border-yellow-200"
                         style={{width: `${width}%`}}
                         data-tip={tooltip}>
                        &nbsp;
                    </div>
                ))}
            </div>
            <div className="border-2 border-transparent">
                {children}
            </div>
            <div className="cursor-pointer h-3">
                {segments.map(({tooltip, width}, index) => (
                    <div key={`segment${index}`}
                         className="border-2 border-transparent h-3 inline-block tooltip tooltip-bottom hover:border-yellow-200"
                         style={{width: `${width}%`}}
                         data-tip={tooltip}>
                        &nbsp;
                    </div>
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
function daylightGradient(spans: Array<SolarSegment>) {
    const steps = spans.slice(1).reduce((acc, {start}, index) => {
        const oldColor = segmentColorsAndTooltipKeys[index][0],
            newColor = segmentColorsAndTooltipKeys[index + 1][0];
        return `${acc}, ${oldColor} ${start}%, ${newColor} ${start}%`;
    }, "");
    return `linear-gradient(to right, ${segmentColorsAndTooltipKeys[0][0]} ${steps})`;
}

/**
 * Convert a raw array of solar intervals to an array of (partial) {@link SolarSegment} containing rendering information
 * for each segment.
 *
 * @param intervals the solar intervals.
 */
function solarSegments(intervals: SolarIntervals) {
    const times = [
            intervals.daylight.start!.minus({hour: 1}),
            intervals.morningCivilTwilight.start!,
            intervals.daylight.start!,
            intervals.daylight.end!,
            intervals.eveningCivilTwilight.end!,
            intervals.daylight.end!.plus({hour: 1})
        ],
        day = intervals.day,
        spanIntervals = _.zip([day.start!, ...times], [...times, day.end!])
            .map(([start, end]) => start!.until(end!)),
        spanWidths = toLengthFractions(day, times).map(percent);
    return _.transform(_.zip(spanIntervals, spanWidths),
        (acc, [interval, percent], index) => {
            acc.push({
                interval: interval!,
                start: 0 === index ? 0 : acc[index - 1].start + acc[index - 1].width,
                width: percent!
            });
        }, new Array<Omit<SolarSegment, "tooltip">>());
}

/**
 * Interval and its *start* and *width* within an interval span, expressed as percentages within a container.
 */
interface SolarSegment {
    interval: Interval;
    start: number;
    tooltip: string;
    width: number;
}

/**
 * Colors and tooltip message keys used in the interval gradient:
 * * AM night
 * * Hour before sunrise
 * * Morning civil twilight
 * * Daylight
 * * Evening civil twilight
 * * Hour after sunset
 * * PM night
 */
const segmentColorsAndTooltipKeys = freeze([
    [colors.slate[300], "cin.tooltip.solar-intervals.am-night"],
    [colors.slate[200], "cin.tooltip.solar-intervals.hour-before-sunrise"],
    [colors.slate[100], "cin.tooltip.solar-intervals.morning-civil-twilight"],
    [colors.slate[50], "cin.tooltip.solar-intervals.daylight"],
    [colors.slate[100], "cin.tooltip.solar-intervals.evening-civil-twilight"],
    [colors.slate[200], "cin.tooltip.solar-intervals.hour-after-sunset"],
    [colors.slate[300], "cin.tooltip.solar-intervals.pm-night"]
]);