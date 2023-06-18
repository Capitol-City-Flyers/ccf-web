import {useCallback, useEffect, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {DateTime, DurationLike, Interval} from "luxon";
import {nowUTC, Periodicity, periodInterval} from "../../utilities/date-utils";
import {useApp} from "../app/AppContext";

/**
 * Properties for a {@link PeriodicDatasetSync} component.
 */
export interface PeriodicDatasetSyncProps {

    /**
     * Flag indicating whether synchronization is active for this dataset, defaults to `true`.
     *
     * If this is set to `false`, the dataset will not be synchronized, and any previously synchronized data will be
     * removed from the local database.
     */
    active?: boolean;

    /**
     * String uniquely identifying the dataset.
     */
    dataset: string;

    /**
     * Lead time prior to the start of a cycle at which it becomes available for import.
     */
    lead?: DurationLike;

    /**
     * The cycle period.
     */
    period: Periodicity;

    /**
     * The logical segments which must be imported for each cycle. Segments are imported one at a time.
     */
    segments: Readonly<Array<string>>;

    /**
     * Callback which handles import of a single segment in a cycle.
     *
     * @param cycle the cycle.
     * @param segment the segment.
     */
    importCycleSegment(cycle: Interval, segment: string): Promise<void>;

    /**
     * Completely remove a cycle (all segments) from the local database.
     *
     * @param cycle the cycle.
     */
    removeCycle(cycle: Interval): Promise<void>;
}

/**
 * {@link PeriodicDatasetSync} handles synchronization of a simple periodically-published dataset to the local database.
 * This is suitable for datasets, such as the FAA NASR datasets, which are published on a predictable schedule (in the
 * case of NASR, once every 28 days.)
 *
 * @param props the component properties.
 * @constructor
 */
export default function PeriodicDatasetSync(props: PeriodicDatasetSyncProps) {
    const {dataset, lead, period, segments} = props,
        active = false !== props.active,
        {dispatch, state: {status: {client: {online, ready}, sync: {datasets}}}} = useApp(),
        synced = useMemo(() => freeze(_.sortBy(datasets.filter(status => status.dataset === dataset), "cycle").sort(), true), [datasets]);

    /* Callback which goes through an array of cycles, compares them against a reference date/time, and removes cycles
    which have expired and adds newly available cycles to sync state. */
    const {removeCycle} = props;
    const updateSynced = useCallback((cycles: Array<string>, reference: DateTime) => {

        /* Remove expired cycles. */
        cycles.map(cycle => [cycle, Interval.fromISO(cycle, {zone: "UTC"})] as const)
            .filter(([, {end}]) => reference >= end)
            .forEach(([cycle, interval]) => {
                removeCycle(interval).then(() => {
                    dispatch({
                        kind: "datasetCycleRemoved",
                        payload: {cycle, dataset}
                    });
                });
            });

        /* Add newly available cycles to state. */
        [periodInterval(period, reference), periodInterval(period, reference, 1)]
            .filter(interval => reference >= interval.start.minus(lead))
            .map(interval => interval.toISO())
            .filter(cycle => !_.includes(cycles, cycle))
            .forEach(cycle => {
                dispatch({
                    kind: "datasetCycleAvailable",
                    payload: {cycle, dataset}
                });
            });
    }, [dispatch, lead, period, removeCycle]);

    /* Trigger updateSynced() at lead time for next cycle or expiration of current cycle, whichever comes first. */
    useEffect(() => {
        if (active && ready) {
            const now = nowUTC(),
                syncedCycles = _.map(synced, "cycle");
            if (_.isEmpty(syncedCycles)) {
                updateSynced(syncedCycles, now);
            } else {
                const {end} = Interval.fromISO(syncedCycles[0]),
                    cutoff = end.minus(lead),
                    delay = now <= cutoff ? cutoff.diff(now) : end.diff(now),
                    timeout = setTimeout(() => {
                        updateSynced(syncedCycles, nowUTC());
                    }, Math.max(0, delay.toMillis()))
                return () => clearTimeout(timeout);
            }
        }
    }, [active, ready, synced]);

    /* Handle asynchronous cycle import and/or removal events. */
    const {importCycleSegment} = props;
    useEffect(() => {
        if (ready) {
            if (!active) {

                /* If synchronization is inactive, remove any imported cycles. Note that we only delete one here; the
                state update will trigger another invocation in which we'll delete the next one. */
                if (!_.isEmpty(synced)) {
                    const {cycle} = _.last(synced);
                    removeCycle(Interval.fromISO(cycle, {zone: "UTC"}))
                        .then(() => {
                            dispatch({
                                kind: "datasetCycleRemoved",
                                payload: {cycle, dataset}
                            });
                        });
                }
            } else if (online) {

                /* Check for a segment that we haven't imported; if found, begin import (one segment at a time.) */
                const found = synced.map(status =>
                    [status.cycle, _.difference(segments, status.segments)] as const)
                    .find(([, missing]) => !_.isEmpty(missing));
                if (found) {
                    const [cycle, [segment]] = found;
                    importCycleSegment(Interval.fromISO(cycle, {zone: "UTC"}), segment)
                        .then(() => {
                            dispatch({
                                kind: "datasetCycleSegmentImported",
                                payload: {cycle, dataset, segment}
                            });
                        })
                        .catch(ex => {
                            console.error(`Error importing [${dataset}] cycle [${cycle}] segment [${segment}].`, ex);
                        });
                }
            }
        }
    }, [active, online, ready, synced]);
    return null;
}
