import {PropsWithChildren, useEffect, useMemo, useReducer} from "react";
import {freeze} from "immer";
import AxiosProvider from "../axios/AxiosProvider";
import DatabaseProvider from "../database/DatabaseProvider";
import GeolocationProvider from "../geolocation/GeolocationProvider";
import MessagesProvider from "../messages/MessagesProvider";
import StorageProvider from "../storage/StorageProvider";
import {appStateContext} from "./AppContext";
import {AppStateImpl} from "./AppStateImpl";
import AppStatePersister from "./AppStatePersister";
import type {ProviderComponentProps} from "./app-types";
import type {AppContext} from "./AppContext";
import NFDCSynchronizer from "../../integrations/faa/nfdc/NFDCSynchronizer";

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

    /* Update state on changes to browser online/offline status. */
    const build = "_build" === env;
    useEffect(() => {
        if (!build) {
            const onOnlineChange = ({type}) => {
                dispatch({
                    kind: "onlineStatusChanged",
                    payload: "online" === type
                });
            }
            window.addEventListener("offline", onOnlineChange);
            window.addEventListener("online", onOnlineChange);
            return () => {
                window.removeEventListener("offline", onOnlineChange);
                window.removeEventListener("online", onOnlineChange);
            };
        }
    }, [dispatch]);
    return (
        <StorageProvider config={config} env={env}>
            <appStateContext.Provider value={context}>
                <AppStatePersister/>
                <GeolocationProvider/>
                <AxiosProvider>
                    <DatabaseProvider>
                        <MessagesProvider>
                            {children}
                        </MessagesProvider>
                        <NFDCSynchronizer />
                    </DatabaseProvider>
                </AxiosProvider>
            </appStateContext.Provider>
        </StorageProvider>
    );
}
