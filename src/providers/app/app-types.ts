import {Method} from "axios";
import {freeze} from "immer";
import {DateTime} from "luxon";
import {Config, Environment} from "../../config-types";
import {GeoPosition} from "../../navigation/navigation-types";
import {NFDCCycle, NFDCSegment} from "../../integrations/faa/nfdc/nfdc-types";

export interface ProviderComponentProps {
    config: Config;
    env: Environment;
}

/**
 * Simple username and password credentials.
 */
export interface BasicCredentials {
    password: string;
    username: string;
}

/**
 * Possible results of an authentication attempt.
 */
export type AuthResult =
    | AuthError
    | AuthSuccess
    | "incorrect"
    | "unavailable";

/**
 * Authentication failed due to an unanticipated error of some sort, *not* due to something expected like invalid
 * credentials.
 */
export interface AuthError {
    kind: "error";
    reason: any;
}

/**
 * Authentication succeeded.
 */
export interface AuthSuccess {
    kind: "success";
    roles: Array<Role>;
}

/**
 * Role type, values in [ROLES].
 */
export type Role = typeof ROLES[number];

export interface RoleResolver {
    evaluateRoles(spec: RolesSpec): boolean;

    missingRoles(...roles: Array<Role | Array<Role>>): Array<Role>;
}

/**
 * Specification for evaluating roles. Note that `all`, single role, or array of roles is evaluated as `AND` (will
 * evaluate to `true` if *all* roles are granted); `any` is evaluated as `OR` (will evaluate to `true` if *any* role is
 * granted.)
 */
export type RolesSpec =
    | Role
    | Array<Role>
    | { all: Role | Array<Role> }
    | { any: Role | Array<Role> };

/**
 * Type guard for [Role].
 *
 * @param value the value to check.
 */
export function isRole(value: any): value is Role {
    return "string" === typeof value
        && -1 !== ROLES.indexOf(value as Role);
}

export const ROLES = freeze([
    "authenticated",
    "fullyAuthenticated",
    "guest",
    "identified",
    "maintenanceAdmin",
    "member",
    "memberAdmin",
    "reportViewer",
    "scheduleAdmin",
    "siteAdmin",
    "superAdmin",
    "unidentified"
] as const);

/**
 * Top level application state.
 */
export interface AppState {
    auth: AuthState;
    prefs: PrefsState;
    status: StatusState;

    toStoredState(): StoredAppState;
}

/**
 * Actions supported by the {@link AppState} dispatcher.
 */
export type AppStateAction =
    | AuthChanged
    | AuthLoggedOut
    | AuthRetentionPrefsChanged
    | DeviceIdAssigned
    | DevicePrefsChanged
    | IdentityPrefsChanged
    | NFDCSegmentCompleted
    | OnlineStatusChanged
    | PositionStatusChanged
    | StateRestored
    | TaskCompleted
    | TaskStarted
    | TaskUpdated
    | VisibleStatusChanged
    | WorkerStatusChanged;

/**
 * Authentication/authorization state.
 */
export interface AuthState {
    credentials?: Partial<BasicCredentials>;
    roles: Array<Role>;
}

/**
 * Preferences and user identity.
 */
export interface PrefsState {
    auth: AuthPrefs;
    device: DevicePrefs;
    identity?: IdentityPrefs;
    ui: UiPrefs;
}

/**
 * Application, device, and network status.
 */
export interface StatusState {
    device?: DeviceStatus;

    /**
     * Is the device online?
     */
    online: boolean;

    position?: GeoPosition;

    tasks: Record<string, BackgroundTask>;

    /**
     * Is the document visible--not obscured by some other window or tab?
     */
    visible: boolean;

    /**
     * Is the service worker installed?
     */
    worker:
        | "undetermined"
        | "installed"
        | "notInstalled";
}

export interface StoredAppState {
    auth: {
        credentials?: Partial<BasicCredentials>;
        roles: Array<Exclude<Role, "fullyAuthenticated">>;
    };
    prefs: PrefsState;
    status: {
        device: Pick<DeviceStatus, "id">;
        position?: StatusState["position"];
    };
}

/**
 * Authentication/authorization preferences.
 */
interface AuthPrefs {
    retention:
        | "none"
        | "saveUsername"
        | "stayLoggedIn";
}

/**
 * Device preferences.
 */
interface DevicePrefs {
    enableGeolocation: boolean;
    install: boolean;
}

/**
 * Device status.
 */
interface DeviceStatus {
    id: string;
}

/**
 * Common data for all background task types.
 */
interface BackgroundTaskBase {
    id: TaskId;
    started: DateTime;
}

/**
 * Background task representing an HTTP request.
 */
interface HttpRequestTask extends BackgroundTaskBase {
    kind: "httpRequest";
    url: URL;
    method: Lowercase<Method>;
    status: {
        phase: "request" | "response";
        progress: number; /* [0..1], 1 upon upload completion; will go back <1 if download sends content-length. */
        received: number; /* bytes */
        sent: number; /* bytes */
        total?: number; /* bytes */
    };
}

/**
 * Union of all background task types.
 */
type BackgroundTask =
    | HttpRequestTask;

/**
 * User identity.
 */
interface IdentityPrefs {
    email: string;
    familyName?: string;
    givenName: string;
}

/**
 * User interface preferences.
 */
interface UiPrefs {
    language: string;
}

interface AuthChanged {
    kind: "authChanged";
    payload: AuthState;
}

interface AuthLoggedOut {
    kind: "authLoggedOut";
}

interface AuthRetentionPrefsChanged {
    kind: "authRetentionPrefsChanged";
    payload: PrefsState["auth"]["retention"];
}

interface DeviceIdAssigned {
    kind: "deviceIdAssigned";
    payload: string;
}

interface DevicePrefsChanged {
    kind: "devicePrefsChanged";
    payload: Partial<DevicePrefs>;
}

interface IdentityPrefsChanged {
    kind: "identityPrefsChanged";
    payload: PrefsState["identity"];
}

interface WorkerStatusChanged {
    kind: "workerStatusChanged";
    payload: StatusState["worker"];
}

interface PositionStatusChanged {
    kind: "positionStatusChanged";
    payload: GeoPosition;
}

interface NFDCSegmentCompleted {
    kind: "nfdcSegmentCompleted";
    payload: {
        cycle: NFDCCycle;
        segment: NFDCSegment;
    }
}

interface OnlineStatusChanged {
    kind: "onlineStatusChanged";
    payload: boolean;
}

interface StateRestored {
    kind: "stateRestored";
    payload: StoredAppState;
}

interface TaskCompleted {
    kind: "taskCompleted";
    payload: TaskId;
}

interface TaskStarted {
    kind: "taskStarted";
    payload: Omit<BackgroundTask, "started">;
}

interface TaskUpdated {
    kind: "taskUpdated";
    payload: {
        id: TaskId;
        status: Partial<BackgroundTask["status"]>;
    };
}

interface VisibleStatusChanged {
    kind: "visibleStatusChanged";
    payload: boolean;
}

export type TaskId = string;
