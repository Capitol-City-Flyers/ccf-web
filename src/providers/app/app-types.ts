import {Method} from "axios";
import {freeze} from "immer";
import {DateTime} from "luxon";
import {Config, Environment} from "../../config-types";
import {GeoPosition} from "../../navigation/navigation-types";
import {DatasetSync, SyncStatus} from "../sync/sync-types";

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
    | BuildInfoRetrieved
    | DatasetCycleAvailable
    | DatasetCycleRemoved
    | DatasetCycleSegmentImported
    | DeviceIdAssigned
    | DevicePrefsChanged
    | IdentityPrefsChanged
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
    client: ClientStatus;

    device?: DeviceStatus;

    position?: GeoPosition;

    sync: SyncStatus;

    tasks: Record<string, BackgroundTask>;
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
        sync: StatusState["sync"];
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

export interface ClientStatus {

    /**
     * NextJS build ID and timestamp.
     */
    build?: {
        id: | "undetermined"
            | "development"
            | string;
        timestamp: DateTime;
        version?: string;
    }

    /**
     * Initialization tasks which haven't been completed yet.
     *
     * * `state`: restore previous state from local storage (if any.)
     */
    initializing?: Array<"state">;

    /**
     * Is the device online?
     */
    online: boolean;

    /**
     * Has the application reached *ready* state? This is `false` until all initialization tasks are complete.
     *
     * @see initializing
     */
    ready: boolean;

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

/**
 * Device preferences.
 */
interface DevicePrefs {
    enableExperimentalFeatures: boolean;
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
    languages: Array<string>;
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

interface BuildInfoRetrieved {
    kind: "buildInfoRetrieved";
    payload: Required<ClientStatus["build"]>;
}

interface DatasetCycleAvailable {
    kind: "datasetCycleAvailable";
    payload: Pick<DatasetSync, "cycle" | "dataset">;
}

interface DatasetCycleRemoved {
    kind: "datasetCycleRemoved";
    payload: Pick<DatasetSync, "cycle" | "dataset">;
}

interface DatasetCycleSegmentImported {
    kind: "datasetCycleSegmentImported";
    payload:
        & Pick<DatasetSync, "cycle" | "dataset">
        & { segment: DatasetSync["segments"][number] };
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
    payload: ClientStatus["worker"];
}

interface PositionStatusChanged {
    kind: "positionStatusChanged";
    payload: GeoPosition;
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
