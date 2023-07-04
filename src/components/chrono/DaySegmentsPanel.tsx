import {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {DateTime, Interval} from "luxon";
import {GeoCoordinates} from "../../navigation/navigation-types";
import {useDateCalc} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import {toLengthFractions, truncate} from "../../utilities/date-utils";
import {percent} from "../../utilities/math-utils";
import {SolarIntervals} from "../../utilities/DateCalc";
import PeriodSegmentsPanel, {SegmentComponentProps} from "./PeriodSegmentsPanel";

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
    const {date, position} = props,
        dateCalc = useDateCalc(),
        messages = useMessages(),
        segments = useMemo<SolarSegment[]>(() => {
            const dateTime = _.isString(date) ? DateTime.fromISO(date) : date,
                baseSegments = solarSegments(dateCalc.solarIntervals(dateTime, position));
            return baseSegments.map((segment, index) => ({
                tooltip: messages.resolve(
                    segmentClassesAndTooltipKeys[index][1],
                    segment.interval.start.toLocaleString(DateTime.TIME_SIMPLE),
                    segment.interval.end.toLocaleString(DateTime.TIME_SIMPLE),
                    segment.interval.toLocaleString(DateTime.TIME_SIMPLE),
                    truncate(segment.interval.toDuration(), "minutes").toHuman()),
                ...segment,
                index
            }));
        }, [dateCalc, messages, position.latitude, position.longitude, _.isString(date) ? date : date.toMillis()]);
    return (
        <PeriodSegmentsPanel segments={segments} segmentComponent={DaySegment}/>
    );
}

export function DaySegment(props: SegmentComponentProps<SolarSegment>) {
    const {segment} = props;
    const {index} = segment;
    return (
        <div
            className={`cursor-pointer inline-block min-w-full w-full tooltip ${segmentClassesAndTooltipKeys[index][0]}`}
            data-tip={segment.tooltip}>
            &nbsp;
        </div>
    );
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
                index
            });
        }, new Array<Omit<SolarSegment, "tooltip">>());
}

/**
 * Interval and its *start* and *width* within an interval span, expressed as percentages within a container.
 */
interface SolarSegment {
    index: number;
    interval: Interval;
    tooltip: string;
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
const segmentClassesAndTooltipKeys = freeze([
    ["bg-slate-300", "cin.tooltip.solar-intervals.am-night"],
    ["bg-slate-200", "cin.tooltip.solar-intervals.hour-before-sunrise"],
    ["bg-slate-100", "cin.tooltip.solar-intervals.morning-civil-twilight"],
    ["bg-slate-50", "cin.tooltip.solar-intervals.daylight"],
    ["bg-slate-100", "cin.tooltip.solar-intervals.evening-civil-twilight"],
    ["bg-slate-200", "cin.tooltip.solar-intervals.hour-after-sunset"],
    ["bg-slate-300", "cin.tooltip.solar-intervals.pm-night"]
]);
