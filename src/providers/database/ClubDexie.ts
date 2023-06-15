import Dexie, {Table} from "dexie";
import type {Airport, WeatherStation} from "../../integrations/faa/nfdc/nfdc-types";

export class ClubDexie extends Dexie {
    airport: Table<Airport>;
    weatherStation: Table<WeatherStation>;

    constructor() {
        super("club");
        this.version(1)
            .stores({
                airport: "key, coordinates.latitude, coordinates.longitude, icaoIdent",
                weatherStation: "key, coordinates.latitude, coordinates.longitude"
            });
    }
}
