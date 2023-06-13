import {PropsWithChildren} from "react";
import {freeze} from "immer";
import {DateTime, Duration} from "luxon";
import {ProviderComponentProps} from "../../../providers/app/app-types";
import DatasetSync, {DatasetSyncProps} from "../../../providers/sync/DatasetSync";
import {Periodicity} from "../../../utilities/date-utils";
import {NASR_SEGMENTS} from "./nfdc-types";

export default function NFDCProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config} = props;
    return (
        <>
            <DatasetSync dataset="faaNasr"
                         lead={ONE_WEEK}
                         period={NASR_PERIOD}
                         segments={NASR_SEGMENTS}/>
            {children}
        </>
    );
}

const ONE_WEEK = freeze(Duration.fromDurationLike({weeks: 1}));

const NASR_PERIOD = freeze<Periodicity>({
    base: DateTime.fromISO("2023-05-18T00:00:00Z", {setZone: true}),
    duration: {days: 28}
}, true);
