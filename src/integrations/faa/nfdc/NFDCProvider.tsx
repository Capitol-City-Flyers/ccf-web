import {PropsWithChildren} from "react";
import {freeze} from "immer";
import {DateTime, Duration} from "luxon";
import {ProviderComponentProps} from "../../../providers/app/app-types";
import PeriodicDatasetSync, {PeriodicDatasetSyncProps} from "../../../providers/sync/PeriodicDatasetSync";
import {Periodicity} from "../../../utilities/date-utils";
import {NASR_SEGMENTS} from "./nfdc-types";

export default function NFDCProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config} = props;
    return (
        <>
            <PeriodicDatasetSync dataset="faaNasr"
                                 lead={ONE_WEEK}
                                 period={NASR_PERIOD}
                                 segments={NASR_SEGMENTS}/>
            {children}
        </>
    );
}

const ONE_WEEK = freeze(Duration.fromDurationLike({minutes: 1}));

const NASR_PERIOD = freeze<Periodicity>({
    base: DateTime.fromISO("2023-05-18T00:00:00Z", {setZone: true}),
    duration: {minutes: 2}
}, true);
