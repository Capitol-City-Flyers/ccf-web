import {useCallback, useEffect, useMemo, useState} from "react";
import {freeze, produce} from "immer";
import _ from "lodash";
import {DateTime, DurationLike, Interval} from "luxon";
import {nowUTC, Periodicity, periodInterval} from "../../utilities/date-utils";
import {useApp, useAppState} from "../app/AppContext";

export interface PeriodicDatasetSyncProps {
    dataset: string;
    lead?: DurationLike;
    period: Periodicity;
    segments: Readonly<Array<string>>;
}

export default function PeriodicDatasetSync(props: PeriodicDatasetSyncProps) {
    const {dataset, lead, period, segments} = props,
        {dispatch, state: {status: {online, ready}}} = useApp(),
        initialState = useMemo<DatasetSyncState>(() => freeze({
            available: [periodInterval(period, nowUTC())],
            expired: []
        }, true), []),
        [cycleState, updateCycleState] = useState(initialState);

    /* Update the available and expired cycle arrays in state. */
    const updateCycles = useCallback((reference: DateTime) => {
        updateCycleState(previous => produce(previous, draft => {
            const {available} = draft;
            draft.expired.push(..._.remove(available, ({end}) => end <= reference));
            if (1 === available.length) {
                const next = periodInterval(period, reference, 1);
                if (next.start.minus(lead) <= reference) {
                    available.push(next);
                }
            }
        }));
    }, [updateCycleState]);

    /* Trigger updateCycles() at lead time for next cycle or expiration of current cycle, whichever comes first. */
    const {available} = cycleState;
    useEffect(() => {
        const now = nowUTC(),
            [{end}] = available,
            cutoff = end.minus(lead),
            delay = now <= cutoff ? cutoff.diff(now) : end.diff(now);
        const timeout = setTimeout(() => {
            updateCycles(nowUTC());
        }, Math.max(0, delay.toMillis()));
        return () => clearTimeout(timeout);
    }, [available]);

    /* Import and remove cycles as appropriate. */
    useEffect(() => {
        console.log("Sync cycles.", {
            available: cycleState.available.map(interval => interval.toISO()),
            expired: cycleState.expired.map(interval => interval.toISO()),
            online, ready
        });
    }, [available, online, ready]);
    return null;
}

interface DatasetSyncState {
    available: Array<Interval>;
    expired: Array<Interval>;
}
