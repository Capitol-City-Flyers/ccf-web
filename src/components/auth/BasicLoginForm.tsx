import {ChangeEvent, useCallback, useState} from "react";
import {produce} from "immer";
import _ from "lodash";
import ActionButton from "../layout/ActionButton";
import {useApp} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import type {BasicCredentials, PrefsState} from "../../providers/app/app-types";

/**
 * Properties for a {@link BasicLoginForm} component.
 */
interface BasicLoginFormProps {
    error?: string;
    form?: BasicLoginFormContents;

    onSubmit(form: BasicLoginFormContents): void;
}

/**
 * Contents of the login form.
 */
export interface BasicLoginFormContents extends BasicCredentials {
    retention: PrefsState["auth"]["retention"];
}

/**
 * [BasicLoginPanel] displays a simple username/password entry panel with *save username* and *stay logged in*
 * checkboxes.
 *
 * @param props the component properties.
 * @constructor
 */
export default function BasicLoginForm(props: BasicLoginFormProps) {
    const {error, form, onSubmit} = props,
        messages = useMessages({
            login: "cin.action.login",
            password: "cin.label.user.password",
            saveUsername: "cin.login.save-username",
            stayLoggedIn: "cin.login.stay-logged-in",
            username: "cin.label.user.username"
        }),
        {dispatch, state: {prefs: {auth: {retention}}}} = useApp(),
        [state, updateState] = useState<BasicLoginFormContents>(() => _.defaults({}, form, {
            username: "",
            password: "",
            retention: "none"
        }));

    /* Form event handlers. */
    const onPasswordChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
        const {target: {value}} = ev;
        updateState(previous => produce(previous, draft => {
            draft.password = value;
        }));
    }, [updateState]);
    const onUsernameChange = useCallback(({target: {value}}: ChangeEvent<HTMLInputElement>) => {
        updateState(previous => produce(previous, draft => {
            draft.username = value;
        }));
    }, [updateState]);
    const onSaveUsernameChange = useCallback(() => {
        updateState(previous => produce(previous, draft => {
            const {retention} = draft;
            draft.retention = "none" === retention ? "saveUsername" : "none";
        }));
    }, [updateState]);
    const onStayLoggedInChange = useCallback(() => {
        updateState(previous => produce(previous, draft => {
            const {retention} = draft;
            draft.retention = "stayLoggedIn" !== retention ? "stayLoggedIn" : "saveUsername"
        }));
    }, [updateState]);

    /* Action event handlers. */
    const onLoginClick = useCallback(() => {
        onSubmit(state);
    }, [onSubmit, state]);
    return (
        <div className="p-3">
            <div className="flex flex-col space-y-2">
                <input className="p-2 rounded-lg"
                       placeholder={messages.username}
                       type="text"
                       value={state.username}
                       onChange={onUsernameChange}/>
                <input className="p-2 rounded-lg"
                       placeholder={messages.password}
                       type="password"
                       value={state.password}
                       onChange={onPasswordChange}/>
                {error && <div className="italic text-red-500">{error}</div>}
            </div>
            <div className="flex flex-row items-center py-2 space-x-4 z-20">
                <label
                    className="whitespace-nowrap drop-shadow-sm cursor-pointer hover:text-blue-500 transition-colors">
                    <input className="cursor-pointer"
                           checked={"none" !== state.retention}
                           type="checkbox"
                           onChange={onSaveUsernameChange}/> {messages.saveUsername}
                </label>
                <label
                    className="whitespace-nowrap drop-shadow-sm cursor-pointer hover:text-blue-500 transition-colors">
                    <input className="cursor-pointer"
                           checked={"stayLoggedIn" === state.retention}
                           type="checkbox"
                           onChange={onStayLoggedInChange}/> {messages.stayLoggedIn}
                </label>
            </div>
            <div className="flex flex-row justify-end">
                <ActionButton onClick={onLoginClick}>{messages.login}</ActionButton>
            </div>
        </div>
    );
}
