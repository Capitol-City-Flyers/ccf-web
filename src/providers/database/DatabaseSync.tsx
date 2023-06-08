import {Sync} from "./database-types";
import {useDateCalc} from "../app/AppContext";

interface DatabaseSyncProps<TSync extends Sync<any>> {
    kind: TSync["kind"];
}

export default function DatabaseSync<TSync extends Sync<any>>() {
    const dates = useDateCalc();
    return null;
}
