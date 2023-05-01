import React, {PropsWithChildren, useEffect, useMemo, useReducer} from "react";
import {freeze} from "immer";
import _, {Dictionary} from "lodash";
import {AppContext, AppContextContents} from "../../context/AppContext";
import {AppState, Auth, Prefs} from "../../state/AppState";
import {AppConfig} from "../../types/AppTypes";
import {StorageService} from "./StorageService";

/**
 * Properties for an {@link AppProvider} component.
 */
interface AppProviderProps {
    config: AppConfig;
    messagesByLocale: Dictionary<Dictionary<string>>;
    window: Window;
}

/**
 * {@link AppProvider} creates and maintains global application state and publishes it as context for access via the
 * {@link useApp}, {@link useAppContext}, and {@link useAppDispatch} hooks.
 *
 * @constructor
 */
export function AppProvider({children, config, messagesByLocale, window}: PropsWithChildren<AppProviderProps>) {
    const storage = useMemo(() => {
            const {localStorage} = window;
            return StorageService.create(localStorage);
        }, [window]),
        initialState = useMemo<AppState>(() => {
            const {document: {documentElement: {lang}}, navigator: {onLine}} = window,
                auth = storage.retrieveAuth() || DEFAULT_AUTH,
                prefs = storage.retrievePrefs() || {
                    locale: lang,
                    ...DEFAULT_PREFS
                };
            return freeze(new AppState(onLine, auth, prefs));
        }, [storage, window]),
        [app, dispatch] = useReducer(AppState.reduce, initialState),
        context = useMemo<Readonly<AppContextContents>>(() =>
            freeze({app, config, dispatch, messagesByLocale}, true), [app, config, dispatch, messagesByLocale]);

    /* Update state on changes to browser online/offline state. */
    useEffect(() => {
        const onOffline = _.partial(dispatch, {
                kind: "online changed",
                payload: false
            }),
            onOnline = _.partial(dispatch, {
                kind: "online changed",
                payload: true
            });
        window.addEventListener("offline", onOffline);
        window.addEventListener("online", onOnline);
        return () => {
            window.removeEventListener("offline", onOffline);
            window.removeEventListener("online", onOnline);
        };
    }, [dispatch, window]);

    /* Synchronize preferences and authentication to local storage. */
    const {prefs} = app;
    useEffect(() => {
        storage.storePrefs(prefs);
    }, [prefs, storage]);
    const {auth} = app;
    useEffect(() => {
        const {loginRetention} = prefs;
        if ("none" === loginRetention) {
            storage.removeAuth();
        } else {
            const {principal, roles} = auth,
                visitor = -1 !== roles.indexOf("visitor");
            if (!visitor && "save authentication" === loginRetention) {
                const {credentials, identity} = auth;
                storage.storeAuth({
                    roles: roles.filter(role => "fullyAuthenticated" !== role),
                    credentials, identity, principal
                });
            } else {
                storage.storeAuth({
                    credentials: null,
                    identity: null,
                    roles: ["visitor"],
                    principal
                });
            }
        }
    }, [auth, prefs, storage]);
    useEffect(() => {
        console.debug("Application config, prefs, and/or state changed.", {app, config, prefs});
    }, [app, config, prefs]);
    return (
        <AppContext.Provider value={context}>
            {children}
        </AppContext.Provider>
    );
}

/**
 * Default authentication.
 */
const DEFAULT_AUTH: Readonly<Auth> = freeze({
    credentials: null,
    principal: null,
    identity: null,
    roles: ["visitor"]
}, true);

/**
 * Default preferences.
 */
const DEFAULT_PREFS: Readonly<Omit<Prefs, "locale">> = freeze({
    loginRetention: "none",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
}, true);
