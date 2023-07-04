import _ from "lodash";
import {Interval} from "luxon";
import {ComponentType, useMemo} from "react";
import {percent, scale} from "../../utilities/math-utils";

/**
 * Object defining an interval to be depicted in a {@link PeriodSegmentsPanel} component.
 */
export interface Segment {
    interval: Interval;
}

/**
 * Properties passed to a *gap* sub-component.
 */
export interface GapComponentProps {
    interval: Interval;
}

/**
 * Properties passed to a *segment* sub-component.
 */
export interface SegmentComponentProps<TSeg extends Segment> {
    interval: Interval;
    segment: TSeg;
}

/**
 * Properties for a {@link PeriodSegmentsPanel} component.
 */
interface PeriodSegmentsPanelProps<TSeg extends Segment> {

    /**
     * Component to render for gaps in the period which are not covered by any segment.
     */
    gapComponent?: ComponentType<GapComponentProps>;

    /**
     * Full period covered by the panel, optional. If not present, the period is the *earliest start* to the *latest
     * end* in the segment array.
     */
    period?: Interval;

    /**
     * The segments to be depicted.
     */
    segments: TSeg[];

    /**
     * Component to render for segments within the period.
     */
    segmentComponent: ComponentType<SegmentComponentProps<TSeg>>;
}

/**
 * {@link PeriodSegmentsPanel} renders a full-width div that represents a period of time divided into segments.
 * Segments are provided as any object implementing {@link Segment}. See {@link periodIntervals} for details on how
 * intervals are calculated and rendered.
 *
 * @param props the component properties.
 * @constructor
 */
export default function PeriodSegmentsPanel<TSeg extends Segment>(props: PeriodSegmentsPanelProps<TSeg>) {
    const intervals = useMemo<PeriodInterval<TSeg>[]>(() => {
        const {segments} = props;
        let period = props.period;
        if (null == period) {
            if (_.isEmpty(segments)) {
                return [];
            }
            const intervals = _.map(segments, "interval");
            period = _.min(_.map(intervals, "start")).until(_.max(_.map(intervals, "end")));
        }
        return periodIntervals(period, segments);
    }, [props.period, props.segments]);
    const GapComponent = props.gapComponent || null;
    const SegmentComponent = props.segmentComponent;
    return (
        <div className="relative w-full">
            {intervals.map(({interval, percent, segment}) => (
                <div key={`interval-${interval.toISO()}`}
                     className="inline-block"
                     style={{
                         maxWidth: `${percent}%`,
                         minWidth: `${percent}%`,
                         width: `${percent}%`
                     }}>
                    {segment
                        ? (<SegmentComponent interval={interval} segment={segment}/>)
                        : (GapComponent && <GapComponent interval={interval}/>)
                    }
                </div>
            ))}
        </div>
    );
}

/**
 * Divide a period into intervals representing an array of segments. The returned intervals cover the *entire* period,
 * including empty intervals for any gaps in the segment array. If any segments overlap, the preceding segment is
 * included in full and the following segment is truncated at its start to remove overlap. Any segments which are
 * completely covered by preceding segments are discarded.
 *
 * @param period the period to cover.
 * @param segments the segments.
 */
function periodIntervals<TSeg extends Segment>(period: Interval, segments: TSeg[]): PeriodInterval<TSeg>[] {

    /* If there are no segments, we have one gap that covers the period; filter to segments overlapping the period. */
    if (_.isEmpty(segments)) {
        return [{
            percent: 100,
            interval: period
        }];
    }
    const {end: periodEnd, start: periodStart} = period;
    const included = segments.filter(({interval}) => interval.overlaps(period));

    /* Divide the period into segments; insert empty gaps to fill any uncovered intervals. */
    const intervals = _.transform(included, (segments, current) => {
        const {interval: {end, start}} = current;
        const previous = _.last(segments);
        const {interval: {end: previousEnd}} = previous;
        if (end > previousEnd) {
            if (start > previousEnd) {
                segments.push({interval: previousEnd.until(start)});
            }
            const interval = _.max([start, previousEnd]).until(_.min([end, periodEnd]));
            segments.push({segment: current, interval});
        }
    }, new Array<Omit<PeriodInterval<TSeg>, "percent">>({interval: periodStart.until(periodStart)}));

    /* Add any necessary gap at the between the end of the last segment and the end of the period. */
    const lastEnd = _.last(intervals).interval.end;
    if (lastEnd < periodEnd) {
        intervals.push({interval: lastEnd.until(periodEnd)});
    }

    /* Remove empty segments and finish non-empty segments with percentages. */
    const periodLength = period.length("milliseconds");
    return _.transform(intervals, (segments, current, index) => {
        const {interval} = current;
        const length = interval.length("milliseconds");
        if (0 !== length) {
            if (index < intervals.length - 1) {
                segments.push({...current, percent: percent(length / periodLength)});
            } else {
                segments.push({
                    ...current,
                    percent: scale(segments.reduce((remainder, {percent}) => remainder - percent, 100), 2)
                });
            }
        }
    }, new Array<PeriodInterval<TSeg>>());
}

/**
 * Interval within a period. If the interval does not correspond to a segment to be depicted in the component, the
 * `segment` value is undefined.
 */
interface PeriodInterval<TSeg extends Segment> {
    interval: Interval;
    percent: number;
    segment?: TSeg;
}
