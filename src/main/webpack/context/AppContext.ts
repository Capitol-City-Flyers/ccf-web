import {createContext, useContext, useMemo} from "react";
import {freeze} from "immer";
import {Dictionary} from "lodash";
import {AppDispatch, AppState, Role} from "../state/AppState";
import {AppConfig} from "../types/AppTypes";
import {Security} from "../types/AuthTypes";
import {LocalDateFormat} from "../utils/DateUtils";
import {TemporalMessages} from "../utils/TemporalMessages";
import {useMessages} from "./MessagesContext";
import {DateCalc} from "../utils/DateCalc";

export interface AppContextContents {
    app: AppState;
    config: AppConfig;
    dispatch: AppDispatch;
    messagesByLocale: Dictionary<Dictionary<string>>;
}

interface LocalDateTimeContextContents {
    temporalMessages: TemporalMessages;

    /**
     * {@link DateCalc} configured with the selected time zone.
     */
    dateCalc: DateCalc;

    /**
     * {@link LocalDateFormat} configured with the selected locale and time zone.
     */
    dateFormat: LocalDateFormat;
}

export const AppContext = createContext<null | Readonly<AppContextContents>>(null);

export function useConfig() {
    return useAppContext().config;
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context!;
}

export function useApp() {
    return useAppContext().app;
}

export function useAppDispatch() {
    return useAppContext().dispatch;
}

export function useAuth() {
    return useAppContext().app.auth;
}

export function useLocalDateTime() {
    const {locale, timeZone} = usePrefs(),
        messages = useMessages();
    return useMemo<LocalDateTimeContextContents>(() => {
        const dateFormat = LocalDateFormat.create(locale, timeZone);
        return freeze({
            temporalMessages: TemporalMessages.create(messages, dateFormat),
            dateCalc: DateCalc.create(timeZone),
            dateFormat
        })
    }, [locale, messages, timeZone]);
}

export function usePrefs() {
    return useAppContext().app.prefs;
}

export function useSecurity() {
    const {roles: hasRoles} = useAuth();
    return useMemo<Readonly<Security>>(() => {
        const missingRoles = (needsRoles: Array<Role>) => needsRoles.filter(role => -1 === hasRoles.indexOf(role));
        return freeze({
            get member() {
                return 0 === missingRoles(["member"]).length;
            },
            get visitor() {
                return 0 === missingRoles(["visitor"]).length;
            },
            hasAll(first, ...additional) {
                return 0 === missingRoles([first, ...additional]).length;
            }
        })
    }, [hasRoles]);
}
