import {useEffect, useState} from "react";
import {produce} from "immer";
import _ from "lodash";
import {DurationLike, Interval} from "luxon";
import {nowUTC, Periodicity, periodInterval} from "../../utilities/date-utils";

export interface DatasetSyncProps {
    dataset: string;
    lead?: DurationLike;
    period: Periodicity;
    segments: Readonly<Array<string>>;
}

export default function DatasetSync(props: DatasetSyncProps) {
    const {dataset, lead, period, segments} = props,
        [available, updateAvailable] = useState<Array<Interval>>([periodInterval(period, nowUTC())]);

    /* Add the next cycle to the available array when it becomes available. */
    useEffect(() => {
        const now = nowUTC(),
            [{end}] = available,
            delay = now.diff(end.minus(lead)),
            timeout = setTimeout(() => {
                updateAvailable(previous => produce(previous, draft => {
                    draft.push(periodInterval(period, now, 1));
                }));
            }, Math.max(0, delay.toMillis()));
        return () => clearTimeout(timeout);
    }, [available[0].toISO()]);

    /* Remove the current cycle from the available array when it expires. */
    useEffect(() => {

    }, [available[0].end.toMillis()]);

    return null;
}