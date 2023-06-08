import {ElementType, PropsWithChildren} from "react";
import {TailNumber} from "./aircraft/aircraft-types";
import type {PrefsState, ProviderComponentProps, Role} from "./providers/app/app-types";
import {DurationLike} from "luxon";

export type Environment =
    | "_build"
    | URL;

export interface AircraftConfig {
    tailNumber: TailNumber;
    modeSCodeHex: string;
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
        }
    }
}

interface DefaultsConfig {
    prefs: Omit<PrefsState, "identity">;
}

interface OperatorConfig {
    aircraft: Array<AircraftConfig>;
}

interface SyncConfig {
    reservations: {
        interval: DurationLike;
    }
}
