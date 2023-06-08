import {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import {ClubDexie} from "./ClubDexie";
import {databaseContext} from "./DatabaseContext";

export default function DatabaseProvider(props: PropsWithChildren) {
    const {children} = props,
        context = useMemo(() => freeze({db: new ClubDexie()}), []);
    return (
        <databaseContext.Provider value={context}>
            {children}
        </databaseContext.Provider>
    );
}
