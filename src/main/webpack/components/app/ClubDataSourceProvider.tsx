import React, {PropsWithChildren, useMemo} from "react";
import {AppConfig} from "../../types/AppTypes";
import {ClubDataContext} from "../../context/ClubDataContext";
import {AircraftClubsDataSource} from "../../integrations/aircraftclubs/AircraftClubsDataSource";
import {AircraftClubsClient} from "../auth/aircraftclubs/AircraftClubsClient";
import {useAuth} from "../../context/AppContext";
import {freeze} from "immer";
import {SessionManager} from "../../integrations/aircraftclubs/SessionManager";

interface ClubDataSourceProviderProps {
    config: AppConfig
}

export function ClubDataSourceProvider({config, children}: PropsWithChildren<ClubDataSourceProviderProps>) {
    const {baseUrl} = config,
        {credentials, principal} = useAuth(),
        context = useMemo(() => {
            const client = AircraftClubsClient.create(new URL("./aircraftclubs/", baseUrl)),
                userCredentials = null == credentials || null == principal ? null : freeze({
                    username: principal,
                    password: credentials
                }),
                sessionManager = SessionManager.create(client, () => userCredentials);
            return AircraftClubsDataSource.create(sessionManager);
        }, [baseUrl, credentials, principal]);
    return (
        <ClubDataContext.Provider value={context}>
            {children}
        </ClubDataContext.Provider>
    );
}
