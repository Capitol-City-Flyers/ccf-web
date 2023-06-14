import {useCallback, useEffect, useMemo, useState} from "react";
import {freeze, produce} from "immer";
import _ from "lodash";
import {DateTime, DurationLike, Interval} from "luxon";
import {nowUTC, Periodicity, periodInterval} from "../../utilities/date-utils";

export interface DatasetSyncProps {
    dataset: string;
    lead?: DurationLike;
    period: Periodicity;
    segments: Readonly<Array<string>>;
}

export default function DatasetSync(props: DatasetSyncProps) {
    const {dataset, lead, period, segments} = props,
        initialState = useMemo<DatasetSyncState>(() => freeze({
            available: [periodInterval(period, nowUTC())],
            expired: []
        }, true), []),
        [state, updateState] = useState(initialState);

    /* Update the available and expired cycles. */
    const updateCycles = useCallback((reference: DateTime) => {
        updateState(previous => produce(previous, draft => {
            const {available} = draft;
            draft.expired.push(..._.remove(available, ({end}) => end <= reference));
            if (1 === available.length) {
                const next = periodInterval(period, reference, 1);
                if (next.start.minus(lead) <= reference) {
                    available.push(next);
                }
            }
        }));
    }, [updateState]);

    /* Trigger updateCycles() at the appropriate time. */
    const {available} = state;
    useEffect(() => {
        const now = nowUTC(),
            [{end}] = available,
            cutoff = end.minus(lead),
            delay = now <= lead ? cutoff.diff(now) : end.diff(now);
        const timeout = setTimeout(() => {
            updateCycles(nowUTC());
        }, Math.max(0, delay.toMillis()));
        return () => clearTimeout(timeout);
    }, [available[0].toISO()]);

    return null;
}

interface DatasetSyncState {
    available: Array<Interval>;
    expired: Array<Interval>;
}
