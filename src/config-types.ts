import {ElementType, PropsWithChildren} from "react";
import type {DurationLike} from "luxon";
import type {AircraftIdent} from "./aircraft/aircraft-types";
import type {PrefsState, ProviderComponentProps, Role} from "./providers/app/app-types";

export type Environment =
    | "_build"
    | URL;

export interface AircraftConfig extends AircraftIdent {
    refs: Partial<{ [K in keyof IntegrationConfig]: string; }>;
}

export interface Config {
    auth: {
        defaultRoles: Array<Role>;
    };
    defaults: DefaultsConfig;
    integration: IntegrationConfig;
    operator: OperatorConfig;
    providers: Array<ElementType<PropsWithChildren<ProviderComponentProps>>>;
    sync: SyncConfig;
}

export interface IntegrationConfig {
    aircraftClubs: {
        baseURL: URL;
        roleMappings: Record<number, Role | Array<Role>>;
    };
    faa: {
        nfdc: {
            baseURL: URL;
            include: Array<
                | "airports"
                | "weatherStations"
            >;
        }
    },
    nominatim: {
        baseURL: URL;
    }
    openSky: {
        baseURL: URL;
    }
}

interface DefaultsConfig {
    prefs: Omit<PrefsState, "identity">;
}

interface OperatorConfig {
    aircraft: Array<AircraftConfig>;
}

export interface SyncConfig {

    /**
     * Synchronization/update of flight status for things like the "I'm Flying" ribbon on the Aircraft Gallery.
     */
    flights: {

        /**
         * Update interval when the aircraft has been seen in flight recently. Typically shorter duration.
         */
        inFlightInterval: DurationLike; /* when known to be in flight (probably shorter duration.) */

        /**
         * Update interval when the aircraft has *not* been seen in flight recently. Typically longer duration.
         */
        notInFlightInterval: DurationLike;
    };
}
