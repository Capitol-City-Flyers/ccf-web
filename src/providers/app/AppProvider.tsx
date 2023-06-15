import {PropsWithChildren, useEffect, useMemo, useReducer} from "react";
import {freeze} from "immer";
import {DateTime} from "luxon";
import AxiosProvider from "../axios/AxiosProvider";
import DatabaseProvider from "../database/DatabaseProvider";
import GeolocationProvider from "../geolocation/GeolocationProvider";
import MessagesProvider from "../messages/MessagesProvider";
import StorageProvider from "../storage/StorageProvider";
import {appStateContext} from "./AppContext";
import AppInstaller from "./AppInstaller";
import {AppStateImpl} from "./AppStateImpl";
import AppStatePersister from "./AppStatePersister";
import type {ProviderComponentProps} from "./app-types";
import type {AppContext} from "./AppContext";

/**
 * {@link AppProvider} initializes basic application state and  standard service provider components. It also monitors
 * for changes in browser online state and provides the application state dispatcher.
 *
 * @param props
 * @constructor
 */
export default function AppProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config, env} = props,
        initialState = useMemo(() => AppStateImpl.initial(env, config), []),
        [state, dispatch] = useReducer(AppStateImpl.reduce, initialState),
        context = useMemo<AppContext>(() => freeze({config, dispatch, env, state}, true), [dispatch, state]);

    /* Assemble and update state with build information. */
    useEffect(() => {
        const element = window.document.querySelector<HTMLScriptElement>("script#__NEXT_DATA__");
        if (null != element) {
            try {
                const {buildId, runtimeConfig: {buildTimestamp, version}} = JSON.parse(element.innerHTML);
                dispatch({
                    kind: "buildInfoRetrieved",
                    payload: Object.assign({
                        id: buildId,
                        timestamp: DateTime.fromISO(buildTimestamp, {setZone: true})
                    }, version && {version})
                });
            } catch (ex) {
                console.error("Failed to read NextJS build ID.", ex);
            }
        }
    }, []);

    /* Update state on changes to browser online/offline status. */
    const build = "_build" === env;
    useEffect(() => {
        const onOnlineChange = ({type}) => {
                dispatch({
                    kind: "onlineStatusChanged",
                    payload: "online" === type
                });
            },
            onVisibleChange = ({target}: Event) => {
                const {visibilityState} = target as Document;
                dispatch({
                    kind: "visibleStatusChanged",
                    payload: "visible" === visibilityState
                });
            }
        window.addEventListener("offline", onOnlineChange);
        window.addEventListener("online", onOnlineChange);
        window.addEventListener("visibilitychange", onVisibleChange);
        return () => {
            window.removeEventListener("offline", onOnlineChange);
            window.removeEventListener("online", onOnlineChange);
            window.removeEventListener("visibilitychange", onVisibleChange);
        };
    }, [dispatch]);
    return (
        <StorageProvider config={config} env={env}>
            <appStateContext.Provider value={context}>
                <AppStatePersister/>
                <AppInstaller/>
                <GeolocationProvider/>
                <AxiosProvider>
                    <DatabaseProvider>
                        <MessagesProvider>
                            {children}
                        </MessagesProvider>
                    </DatabaseProvider>
                </AxiosProvider>
            </appStateContext.Provider>
        </StorageProvider>
    );
}
