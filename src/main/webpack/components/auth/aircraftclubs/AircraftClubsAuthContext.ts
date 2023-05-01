import {createContext, useContext} from "react";
import {AircraftClubsClient} from "./AircraftClubsClient";

export interface AircraftClubsAuthContextContents {
    client: AircraftClubsClient;
}

export const AircraftClubsAuthContext = createContext<null | Readonly<AircraftClubsAuthContextContents>>(null);

export function useAircraftClubsAuth() {
    const context = useContext(AircraftClubsAuthContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context!;
}
