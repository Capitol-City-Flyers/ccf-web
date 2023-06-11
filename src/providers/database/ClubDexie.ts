import Dexie, {Table} from "dexie";
import type {Reservation, Sync} from "./database-types";
import {Airport, WeatherStation} from "../../integrations/faa/nfdc/nfdc-types";

export class ClubDexie extends Dexie {
    airport: Table<Airport>;
    weatherStation: Table<WeatherStation>;
    reservation: Table<Reservation>;
    sync: Table<Sync<any>>;

    constructor() {
        super("club");
        this.version(1)
            .stores({
                airport: "key, coordinates.latitude, coordinates.longitude, icaoIdent",
                weatherStation: "key, coordinates.latitude, coordinates.longitude",
                reservation: "id++, tailNumber, dateTimeRange",
                sync: "kind"
            });
    }
}
