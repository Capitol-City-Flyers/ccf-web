import {freeze, immerable, produce} from "immer";
import {Dispatch, Reducer} from "react";
import _ from "lodash";

export class AppState {
    [immerable] = true;

    constructor(public online: boolean, public auth: Auth, public prefs: Prefs) {

    }

    /**
     * Reducer for {@link AppAction} actions.
     *
     * @param previous the previous state.
     * @param action the action.
     */
    static reduce(previous: AppState, action: AppAction) {
        const {kind} = action;
        switch (kind) {
            case "login retention changed":
                return produce(previous, draft => {
                    draft.prefs.loginRetention = action.payload;
                });
            case "online changed":
                return produce(previous, draft => {
                    draft.online = action.payload;
                });
            case "time zone changed":
                return produce(previous, draft => {
                    draft.prefs.timeZone = action.payload;
                });
            case "user authenticated":
            case "user authenticated fully":
                return produce(previous, draft => {
                    const {auth} = draft,
                        {payload: {credentials, identity, roles}} = action;
                    auth.credentials = credentials;
                    auth.identity = identity;
                    auth.principal = identity.username;

                    /* Update roles, ensuring that "fullyAuthenticated" is always present on full authentication. */
                    const allRoles = [...roles];
                    if ("user authenticated fully" === kind && -1 === allRoles.indexOf("fullyAuthenticated")) {
                        allRoles.push("fullyAuthenticated");
                    }
                    auth.roles.splice(0, auth.roles.length, ..._.uniq(allRoles));
                });
            case "user authentication failed":
            case "user logged out":
                return produce(previous, draft => {

                    /* Set authentication back to "visitor" status. */
                    const {auth, prefs} = draft,
                        {roles} = auth;
                    roles.splice(0, roles.length, "visitor");
                    auth.credentials = null;
                    auth.identity = null;
                    switch (prefs.loginRetention) {
                        case "none":

                            /* Clear principal since "save username" is not set. */
                            auth.principal = null;
                            break;
                        case "save authentication":

                            /* User logged out, implying they no longer want to stay logged in. */
                            prefs.loginRetention = "save principal";
                            break;
                    }
                });
        }
    }
}

export interface Auth {
    credentials: null | string;
    identity: null | {
        displayName: string;
        email: string;
        firstName: null | string;
        lastName: null | string;
        userId: string;
        username: string;
    },
    principal: null | string;
    roles: Array<Role>;
}

/**
 * Device preferences.
 */
export interface Prefs {
    locale: string;
    loginRetention:
        | "none"
        | "save principal"
        | "save authentication";
    timeZone: string;
}

/**
 * *Login retention* device preference changed.
 */
interface LoginRetentionChanged {
    kind: "login retention changed";
    payload: Prefs["loginRetention"];
}

/**
 * Browser online/offline status changed.
 */
interface OnlineChanged {
    kind: "online changed";
    payload: boolean;
}

/**
 * *Time zone* device preference changed.
 */
interface TimeZoneChanged {
    kind: "time zone changed";
    payload: string;
}

/**
 * User authenticated.
 */
interface UserAuthenticated {
    kind: "user authenticated";
    payload: {
        credentials: null | string;
        identity: Exclude<Auth["identity"], null>;
        roles: Array<Role>;
    }
}

/**
 * User passed an authentication challenge in this session.
 */
interface UserAuthenticatedFully extends Omit<UserAuthenticated, "kind"> {
    kind: "user authenticated fully";
}

interface UserAuthenticationFailed {
    kind: "user authentication failed";
}

/**
 * User logged out.
 */
interface UserLoggedOut {
    kind: "user logged out";
}

/**
 * All actions which can be performed on an {@link AppState}.
 */
export type AppAction =
    | LoginRetentionChanged
    | OnlineChanged
    | TimeZoneChanged
    | UserAuthenticated
    | UserAuthenticatedFully
    | UserAuthenticationFailed
    | UserLoggedOut;

/**
 * Dispatcher for {@link AppAction}.
 */
export type AppDispatch = Dispatch<AppAction>;

/**
 * Reducer for {@link AppAction} on {@link AppState}.
 */
export type AppReducer = Reducer<AppDispatch, AppAction>;

/**
 * All supported roles.
 */
export const ROLES = freeze([
    "authenticated",
    "fullyAuthenticated",
    "guest",
    "maintenanceAdmin",
    "member",
    "memberAdmin",
    "reportViewer",
    "scheduleAdmin",
    "siteAdmin",
    "superAdmin",
    "visitor"
] as const);

/**
 * All supported roles.
 */
export type Role = typeof ROLES[number];
