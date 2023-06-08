import {useEffect, useMemo, useState} from "react";
import type {Table} from "dexie";
import {freeze} from "immer";
import {DateTime} from "luxon";
import {useDatabase} from "../../../providers/database/DatabaseContext";
import {useApp} from "../../../providers/app/AppContext";
import {SyncProcess} from "./SyncProcess";
import type {Sync} from "../../../providers/database/database-types";
import {useAircraftClubsClient} from "../AircraftClubsContext";
import {SessionManager} from "../session/SessionManager";
import {BasicCredentials} from "../../../providers/app/app-types";

/**
 * {@link AircraftClubsSynchronizer} synchronizes data between AircraftClubs and the local database.
 *
 * @constructor
 */
export default function AircraftClubsSynchronizer() {
    const {state: {auth: {credentials}}, config} = useApp(),
        dexie = useDatabase(),
        aircraft = useMemo(() => freeze(config.operator.aircraft.filter(aircraft => "aircraftClubs" in aircraft.refs), true), []),
        {sync: syncConfig} = config,
        {sync} = dexie,
        [syncDateTime, setSyncDateTime] = useState<DateTime>(null),
        reservationSyncInterval = syncConfig.reservations.interval;

    const client = useAircraftClubsClient(),
        manager = useMemo(() => SessionManager.create(client, credentials as BasicCredentials), []);

    /* Initialize sync time on initial render. */
    useEffect(() => {
        sync.where("kind")
            .equals("aircraftClubs")
            .last()
            .then(result => {
                const dateTime = result?.dateTime;
                setSyncDateTime(dateTime ? DateTime.fromISO(dateTime) : DateTime.fromMillis(0));
            });
    }, []);

    /* Trigger sync whenever the interval elapses. */
    useEffect(() => {
        if (null == syncDateTime) {
            return;
        }

        /* Determine delay based on previous sync and interval; set a timeout to trigger sync. */
        const nextSync = syncDateTime.plus(reservationSyncInterval),
            performSync = () => {
                updateSyncTable(sync, "reservations")
                    .then(async dateTime => {
                        try {
                            const session = await manager.useSession(),
                                sync = SyncProcess.create(dexie, session);
                            await Promise.all(aircraft.map(aircraft => sync.syncReservations(aircraft)));
                        } finally {
                            setSyncDateTime(dateTime);
                        }
                    });
            },
            delay = nextSync.diff(DateTime.now()).rescale(),
            delayMillis = delay.toMillis();
        if (delayMillis <= 0) {
            console.debug("Triggering sync now.");
            performSync();
        } else {
            console.debug(`Will trigger sync in ${delay.toHuman()}.`);
            const timer = setTimeout(performSync, delayMillis)
            return () => clearTimeout(timer);
        }
    }, [manager, syncDateTime, reservationSyncInterval]);
    return null;
}

/**
 * Update (or add) the row in the sync table for a given sync `kind` to reflect *now* as the sync timestamp.
 *
 * @param table the sync table.
 * @param kind the row whose timestamp is to be updated.
 */                                 
async function updateSyncTable(table: Table<Sync<any>>, kind: Sync<any>["kind"]) {
    const sync = await table.where("kind").equals(kind).last(),
        now = DateTime.now();
    if (null != sync) {
        await table.update(kind, {
            dateTime: now.toISO(),
            kind
        } satisfies Sync<any>);
    } else {
        await table.add({
            dateTime: now.toISO(),
            kind
        });
    }
    return now;
}
