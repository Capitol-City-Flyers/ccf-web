import {useCallback} from "react";
import {DateTime, Duration, Interval} from "luxon";
import {ClubDexie} from "../../../providers/database/ClubDexie";
import PeriodicDatasetSync from "../../../providers/sync/PeriodicDatasetSync";
import {NASR_SEGMENTS} from "./nfdc-types";
import {NFDCClient} from "./NFDCClient";
import {freeze} from "immer";
import {Periodicity} from "../../../utilities/date-utils";
import {usePrefs} from "../../../providers/app/AppContext";

interface NASRSyncProps {
    client: NFDCClient;
    db: ClubDexie;
}

export default function NASRSync(props: NASRSyncProps) {
    const {client, db} = props,
        {device: {install}} = usePrefs();

    /* Callback which handles import of a single NASR segment. */
    const importCycleSegment = useCallback((cycle: Interval, segment: string) =>
        Promise.resolve().then(async () => {
            console.debug(`Importing NASR cycle [${cycle}] segment [${segment}].`);
            const cycleStartDate = cycle.start.toISODate();
            switch (segment) {
                case "airports":
                    await db.airport.bulkPut((await client.getAirports(cycle)).map(airport => ({
                        key: `nasr:${cycleStartDate}:${airport.ident}`,
                        ...airport
                    })));
                    break;
                case "weatherStations":
                    await db.weatherStation.bulkPut((await client.getWeatherStations(cycle)).map(station => ({
                        key: `nasr:${cycleStartDate}:${station.ident}`,
                        ...station
                    })));
                    break;
            }
        }), [client, db]);

    /* Callback which handles removal of an NASR cycle. */
    const removeCycle = useCallback((cycle: Interval) =>
        Promise.resolve().then(async () => {
            console.debug(`Removing NASR cycle [${cycle}].`);
            const prefix = `nasr:${cycle.start.setZone("UTC").toISODate()}:`;
            await db.airport.where("key").startsWith(prefix).delete()
            await db.weatherStation.where("key").startsWith(prefix).delete();
        }), [db]);
    return (
        <PeriodicDatasetSync active={install}
                             dataset="faaNasr"
                             lead={NASR_LEAD}
                             period={NASR_PERIOD}
                             segments={NASR_SEGMENTS}
                             importCycleSegment={importCycleSegment}
                             removeCycle={removeCycle}/>
    );
}

/**
 * NASR cycle period.
 */
const NASR_PERIOD = freeze<Periodicity>({
    base: DateTime.fromISO("2023-05-18T00:00:00Z", {setZone: true}),
    duration: {days: 28}
}, true);

/**
 * Lead time before a new NASR cycle is considered available for early download.
 */
const NASR_LEAD = freeze(Duration.fromDurationLike({weeks: 1}));
