import {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import {aircraftClubsContext} from "./AircraftClubsContext";
import {useRoles} from "../../providers/app/AppContext";
import {useAxiosInstance} from "../../providers/axios/AxiosInstanceContext";
import type {ProviderComponentProps} from "../../providers/app/app-types";
import type {AircraftClubsContext} from "./AircraftClubsContext";
import {AircraftClubsClient, DOM_PARSER} from "@capitol-city-flyers/ccf-web-integration";

export default function AircraftClubsProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config} = props,
        axios = useAxiosInstance({baseURL: config.integration.aircraftClubs.baseURL.href}),
        roles = useRoles(),
        context = useMemo<AircraftClubsContext>(() => freeze({client: AircraftClubsClient.create(axios, DOM_PARSER, false)}, true), [axios]);
    return (
        <aircraftClubsContext.Provider value={context}>
            {children}
        </aircraftClubsContext.Provider>
    );
}
