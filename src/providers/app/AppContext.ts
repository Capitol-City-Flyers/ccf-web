import {createContext, Dispatch, useContext, useMemo} from "react";
import {createRoleResolver} from "./app-utils";
import {IANAZone, Zone} from "luxon";
import {DateCalc} from "../../utilities/DateCalc";
import type {Config, Environment} from "../../config-types";
import type {AppState, AppStateAction, Role, RoleResolver, RolesSpec} from "./app-types";

export interface AppContext {
    config: Config;
    dispatch: Dispatch<AppStateAction>;
    env: Environment;
    state: AppState;
}

export const appStateContext = createContext<AppContext | null>(null);

export function useApp() {
    const context = useContext(appStateContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context!;
}

export function useAppDispatch() {
    return useApp().dispatch;
}

export function useAppState() {
    return useApp().state;
}

export function useConfig() {
    return useApp().config;
}

/**
 * Hook to get a {@link DateCalc} instance for a given time zone:
 * * `_browser` for the browser time zone.
 * * Luxon {@link Zone} instance.
 * * IANA time zone name.
 *
 * Defaults to the browser time zone.
 *
 * @param zone the time zone.
 */
export function useDateCalc(zone: "_browser" | string | Zone = "_browser") {
    return useMemo(() => {
        let actualZone: Zone;
        if (zone instanceof Zone) {
            actualZone = zone;
        } else if ("_browser" === zone) {
            actualZone = IANAZone.create(Intl.DateTimeFormat().resolvedOptions().timeZone);
        } else {
            actualZone = IANAZone.create(zone);
        }
        return DateCalc.create(actualZone);
    }, [zone instanceof Zone ? zone.name : zone]);
}

export function usePrefs() {
    return useAppState().prefs;
}

/**
 * Hook to get all granted roles as record, with keys being role names and values being `true`. Also accepts an optional
 * `spec` object for resolving specific roles or arrays of roles; for each key in the spec object, the returned record
 * will contain a key/value pair mapping the original key to `true` if the corresponding {@link RolesSpec} was met.
 *
 * @param spec the optional spec object.
 */
export function useRoles<S extends Record<string, RolesSpec>>(
    spec?: S
): RoleResolver & Partial<{ [R in Role]: true } & { [K in keyof S]: true }> {
    const {auth: {roles: granted}} = useAppState();
    return useMemo(() => createRoleResolver(granted, spec), [granted, spec]);
}
