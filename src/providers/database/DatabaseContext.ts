import {ClubDexie} from "./ClubDexie";
import {createContext, useContext} from "react";

interface DatabaseContext {
    db: ClubDexie;
}

export const databaseContext = createContext<DatabaseContext | null>(null);

export function useDatabase() {
    const context = useContext(databaseContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context!.db;
}
