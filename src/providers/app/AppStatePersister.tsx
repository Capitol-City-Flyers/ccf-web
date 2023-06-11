import {useEffect, useState} from "react";
import _ from "lodash";
import {useStorage} from "../storage/StorageContext";
import {useApp} from "./AppContext";
import type {StoredAppState} from "./app-types";

/**
 * {@link AppStatePersister} saves and restores state in local storage. It also assigns a random device identifier on
 * first access.
 *
 * @constructor
 */
export default function AppStatePersister() {
    const storage = useStorage<StoredAppState>("state.0"),
        {dispatch, state} = useApp(),
        [storedState, updateStoredState] = useState<StoredAppState | null>(null);

    /* Restore any persistent state on initial render. If there is no persisted state, allocate a device ID. */
    useEffect(() => {
        const restoredState = storage.getItem("state");
        if (null != restoredState) {
            dispatch({
                kind: "stateRestored",
                payload: restoredState
            });
        } else {
            dispatch({
                kind: "deviceIdAssigned",
                payload: window.crypto.randomUUID()
            });
        }
    }, []);

    /* Update persistent state when applicable state changes occur. */
    useEffect(() => {
        updateStoredState(previousStoredState => {
            const updatedStoredState = state.toStoredState();
            if (_.isEqual(previousStoredState, updatedStoredState)) {
                return previousStoredState;
            }
            return updatedStoredState;
        });
    }, [state.auth, state.prefs, state.status.device, state.status.position, state.status.sync]);

    /* Update local storage when persistent state changes occur. */
    useEffect(() => {
        if (null != storedState) {
            console.debug("Updating stored state.", storedState);
            storage.setItem("state", storedState);
        }
    }, [storedState]);
    return null;
}