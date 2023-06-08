import {ClubDexie} from "../../../providers/database/ClubDexie";
import {freeze} from "immer";
import _ from "lodash";
import type {AircraftClubsSession} from "../session/AircraftClubsSession";
import {DateTime} from "luxon";
import {AircraftConfig} from "../../../config-types";

export class SyncProcess {
    private constructor(
        private dexie: ClubDexie,
        private session: AircraftClubsSession
    ) {
    }

    async syncReservations(aircraft: AircraftConfig): Promise<void> {
        const {dexie, session} = this,
            {zone} = session,
            now = DateTime.now().setZone(zone),
            range = now.minus({month: 1}).startOf("month")
                .until(now.plus({month: 2}).startOf("month"));

        /* Get existing bookings from AircraftClubs; perform deletes and updates. */
        const sources = await session.getBookingsForCalendar(aircraft, range),
            sourcesById = _.keyBy(sources, source => source.ref.aircraftClubs);
        await dexie.reservation.where("tailNumber")
            .equals(aircraft.tailNumber)
            .modify((target, ctx) => {
                const id = target.ref.aircraftClubs;
                if (!sourcesById.hasOwnProperty(id)) {
                    delete ctx.value;
                } else {
                    const source = sourcesById[id];
                    target.dateTimeRange = source.dateTimeRange;
                    delete sourcesById[id];
                }
            });

        /* Perform adds for sources which did not match existing targets. */
        await dexie.reservation.bulkAdd(Object.values(sourcesById));
        return Promise.resolve();
    }

    static create(db: ClubDexie, session: AircraftClubsSession) {
        return freeze(new SyncProcess(db, session), true);
    }
}
