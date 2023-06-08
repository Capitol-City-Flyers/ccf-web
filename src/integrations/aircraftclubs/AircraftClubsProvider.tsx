import {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import {aircraftClubsContext} from "./AircraftClubsContext";
import {AircraftClubsClient} from "./AircraftClubsClient";
import AircraftClubsSynchronizer from "./data/AircraftClubsSynchronizer";
import {useRoles} from "../../providers/app/AppContext";
import {useAxiosInstance} from "../../providers/axios/AxiosInstanceContext";
import type {ProviderComponentProps} from "../../providers/app/app-types";
import type {AircraftClubsContext} from "./AircraftClubsContext";

export default function AircraftClubsProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config} = props,
        axios = useAxiosInstance({baseURL: config.integration.aircraftClubs.baseURL.href}),
        roles = useRoles(),
        context = useMemo<AircraftClubsContext>(() => freeze({client: AircraftClubsClient.create(axios)}, true), [axios]);
    return (
        <aircraftClubsContext.Provider value={context}>
            {roles.authenticated && <AircraftClubsSynchronizer/>}
            {children}
        </aircraftClubsContext.Provider>
    );
}
