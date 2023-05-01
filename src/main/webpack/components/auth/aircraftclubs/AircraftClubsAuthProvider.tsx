import React, {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import {AircraftClubsAuthContext, AircraftClubsAuthContextContents} from "./AircraftClubsAuthContext";
import {AircraftClubsClient} from "./AircraftClubsClient";

interface AircraftClubsAuthProviderProps {
    baseUrl: URL;
}

export function AircraftClubsAuthProvider({baseUrl, children}: PropsWithChildren<AircraftClubsAuthProviderProps>) {
    const context = useMemo<AircraftClubsAuthContextContents>(() => freeze({
        client: AircraftClubsClient.create(baseUrl)
    }), [baseUrl]);
    return (
        <AircraftClubsAuthContext.Provider value={context}>
            {children}
        </AircraftClubsAuthContext.Provider>
    );
}
