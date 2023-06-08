import Dexie, {Table} from "dexie";
import type {Reservation, Sync} from "./database-types";

export class ClubDexie extends Dexie {
    reservation: Table<Reservation>;
    sync: Table<Sync<any>>;

    constructor() {
        super("club");
        this.version(1)
            .stores({
                reservation: "id++, tailNumber, dateTimeRange",
                sync: "kind"
            });
    }
}
