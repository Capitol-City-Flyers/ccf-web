import {createContext, useContext} from "react";
import {AircraftClubsClient} from "@capitol-city-flyers/ccf-web-integration";

/**
 * Object stored in the AircraftClubs context.
 */
export interface AircraftClubsContext {

    /**
     * Direct access to the AircraftClubs API client, primarily for login/logout operations.
     */
    client: AircraftClubsClient;
}

/**
 * Context in which AircraftClubs state is stored.
 */
export const aircraftClubsContext = createContext<AircraftClubsContext | null>(null);

/**
 * Hook to retrieve the [AircraftClubsClient].
 */
export function useAircraftClubsClient() {
    return useAircraftClubs().client;
}

export function useAircraftClubs() {
    const context = useContext(aircraftClubsContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context;
}
