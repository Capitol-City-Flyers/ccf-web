import React, {ChangeEvent, useCallback, useState} from "react";
import {immerable, produce} from "immer";
import {useAppContext} from "../../../context/AppContext";
import {Auth, Prefs} from "../../../state/AppState";
import {isAuthFailure} from "../../../types/AuthTypes";
import {ActionButton} from "../../layout/ActionButton";
import {useAircraftClubsAuth} from "./AircraftClubsAuthContext";

class PanelState {
    [immerable] = true;

    password: string = "";
    saveUsername: boolean;
    stayLoggedIn: boolean;
    username: string;

    constructor(auth: Auth, prefs: Prefs) {
        const {loginRetention} = prefs;
        if ("none" === loginRetention) {
            this.saveUsername = false;
            this.stayLoggedIn = false;
            this.username = "";
        } else {
            this.saveUsername = true;
            this.stayLoggedIn = "save authentication" === loginRetention;
            const {principal} = auth;
            this.username = principal || "";
        }
    }

    get loginRetention(): Prefs["loginRetention"] {
        if (this.stayLoggedIn) {
            return "save authentication";
        } else if (this.saveUsername) {
            return "save principal";
        } else {
            return "none";
        }
    }
}

export function AircraftClubsLoginPanel() {
    const {app: {auth, prefs}, dispatch} = useAppContext(),
        {client} = useAircraftClubsAuth(),
        [state, setState] = useState(() => new PanelState(auth, prefs));

    /* Handle changes in form elements, applying them to the dialog state. */
    const onPasswordChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
        const {target: {value}} = ev;
        setState(previous => produce(previous, draft => {
            draft.password = value;
        }));
    }, [setState]);
    const onUsernameChange = useCallback(({target: {value}}: ChangeEvent<HTMLInputElement>) => {
        setState(previous => produce(previous, draft => {
            draft.username = value;
        }));
    }, [setState]);
    const onSaveUsernameChange = useCallback(() => {
        setState(previous => produce(previous, draft => {
            const value = !draft.saveUsername;
            draft.saveUsername = value;
            if (!value) {
                draft.stayLoggedIn = false;
            }
        }));
    }, [setState]);
    const onStayLoggedInChange = useCallback(() => {
        setState(previous => produce(previous, draft => {
            const value = !draft.stayLoggedIn;
            draft.stayLoggedIn = value;
            if (value) {
                draft.saveUsername = true;
            }
        }));
    }, [setState]);

    /* Handle click in the "login" button. Attempts to authenticate with AircraftClubs. */
    const onLoginClick = useCallback(() => {
        const {username, password} = state;
        client.authenticate({username, password}).then(response => {
            if (isAuthFailure(response)) {
                console.error("AircraftClubs authentication failed.", response);
                dispatch({kind: "user authentication failed"});
            } else {

                /* Successful. Update authentication state and login retention preferences. */
                console.debug("AircraftClubs authentication succeeded.", response);
                const {identity, roles} = response,
                    {loginRetention} = state;
                dispatch({
                    kind: "user authenticated fully",
                    payload: {
                        credentials: password,
                        identity, roles
                    }
                });
                dispatch({
                    kind: "login retention changed",
                    payload: loginRetention
                });
            }
        }).catch(ex => {
            console.error("AircraftClubs authentication failed.", ex);
            return ex;
        });
    }, [client, dispatch, prefs, state]);

    return (
        <div className="p-3">
            <div className="flex flex-col space-y-2">
                <input className="p-2 rounded-lg"
                       placeholder="Username"
                       type="text"
                       value={state.username}
                       onChange={onUsernameChange}/>
                <input className="p-2 rounded-lg"
                       placeholder="Password"
                       type="password"
                       value={state.password}
                       onChange={onPasswordChange}/>
            </div>
            <div className="flex flex-row items-center py-2 space-x-4 z-20">
                <label
                    className="whitespace-nowrap drop-shadow-sm cursor-pointer hover:text-blue-500 transition-colors">
                    <input type="checkbox"
                           className="cursor-pointer"
                           checked={state.saveUsername}
                           onChange={onSaveUsernameChange}/> Save username
                </label>
                <label
                    className="whitespace-nowrap drop-shadow-sm cursor-pointer hover:text-blue-500 transition-colors">
                    <input type="checkbox"
                           className="cursor-pointer"
                           checked={state.stayLoggedIn}
                           onChange={onStayLoggedInChange}/> Stay logged in
                </label>
            </div>
            <div className="flex flex-row justify-end">
                <ActionButton onClick={onLoginClick}>Login</ActionButton>
            </div>
        </div>
    );
}
