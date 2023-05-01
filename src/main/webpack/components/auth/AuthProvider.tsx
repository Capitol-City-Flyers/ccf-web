import React, {PropsWithChildren, useMemo} from "react";
import {AircraftClubsAuthProvider} from "./aircraftclubs/AircraftClubsAuthProvider";

interface AuthProviderProps {
    document: Document;
}

export function AuthProvider({children, document}: PropsWithChildren<AuthProviderProps>) {
    const {baseURI} = document,
        baseUrl = useMemo(() => new URL("./aircraftclubs/", new URL(baseURI)), [baseURI]);
    return (
        <AircraftClubsAuthProvider baseUrl={baseUrl}>
            {children}
        </AircraftClubsAuthProvider>
    );
}
