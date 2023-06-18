import {castDraft, freeze, immerable, produce} from "immer";
import _ from "lodash";
import {nowUTC} from "../../utilities/date-utils";
import type {Config, Environment} from "../../config-types";
import type {
    AppState,
    AppStateAction,
    AuthState,
    ClientStatus,
    PrefsState,
    StatusState,
    StoredAppState
} from "./app-types";
import {WritableDraft} from "immer/src/types/types-external";

/**
 * {@link AppStateImpl} is the implementation of the {@link AppState} interface.
 */
export class AppStateImpl implements AppState {
    [immerable] = true;

    readonly auth: AuthState;
    readonly prefs: PrefsState;
    readonly status: StatusState;

    private constructor(initial: Omit<AppState, "toStoredState">) {
        this.auth = initial.auth;
        this.prefs = initial.prefs;
        this.status = initial.status;
    }

    /**
     * Create a {@link StoredAppState} containing persistent data from this state. The following items are included:
     * * `status.device.id` is always stored.
     * * `status.position` is stored if geolocation is enabled.
     * * `prefs`, except `identity`, is always stored.
     * * `auth.credentials.username` and `auth.roles` (as `[unidentified]`) is stored for auth retention `saveUsername`.
     * * `auth.credentials.password`, `auth.roles` (except `fullyAuthenticated`), and `prefs.identity` are stored for
     *   auth retention `stayLoggedIn`.
     * * `auth.roles` is stored as `[unidentified]` *except* in the `stayLoggedIn` case.
     */
    toStoredState() {
        const {auth, prefs, status} = this,
            {auth: {retention}, device: {enableGeolocation}, identity} = prefs,
            {credentials} = auth;
        return freeze<StoredAppState>(_.merge({
            prefs: _.omit(prefs, "identity"),
            status: _.pick(status, ["device", "sync", ...[enableGeolocation ? "position" : []]])
        }, "saveUsername" === retention && credentials && {
            auth: {
                credentials: {
                    username: credentials.username
                },
                roles: ["unidentified"]
            }
        }, "stayLoggedIn" === retention && credentials?.password && {
            auth: {
                roles: auth.roles.filter(role => "fullyAuthenticated" !== role),
                credentials
            },
            prefs: {identity}
        }) as StoredAppState, true);
    }

    /**
     * Create an initial state by merging the default state with applicable configuration items.
     *
     * @param env the environment.
     * @param config the application configuration.
     */
    static initial(env: Environment, config: Config) {
        const build = "_build" === env;
        return freeze(new AppStateImpl(_.cloneDeep({
            auth: {
                roles: config.auth.defaultRoles
            },
            prefs: _.merge({}, config.defaults.prefs, !build && window.navigator.languages && {
                ui: {
                    languages: window.navigator.languages
                }
            }),
            status: {
                client: {
                    initializing: ["state"],
                    online: !build && window.navigator.onLine,
                    ready: false,
                    standalone: checkStandalone(env),
                    visible: !build && "visible" === window.document.visibilityState,
                    worker: "undetermined",
                },
                sync: {
                    datasets: []
                },
                tasks: {}
            }
        })), true);
    }

    /**
     * Reducer for {@link AppStateAction}.
     *
     * @param previous the previous state.
     * @param action the action.
     */
    static reduce(previous: AppStateImpl, action: AppStateAction): AppStateImpl {
        switch (action.kind) {
            case "authChanged":
                return produce(previous, draft => {
                    draft.auth = action.payload;
                });
            case "authLoggedOut":
                return produce(previous, draft => {
                    const {auth, prefs} = draft;
                    auth.roles.splice(0, auth.roles.length, "unidentified");
                    prefs.auth.retention = "none";
                    delete auth.credentials;
                    delete prefs.identity;
                });
            case "authRetentionPrefsChanged":
                return produce(previous, draft => {
                    draft.prefs.auth.retention = action.payload;
                });
            case "buildInfoRetrieved":
                return produce(previous, draft => {
                    const {status: {client}} = draft;
                    _.assign(client, {
                        build: action.payload
                    });
                });
            case "datasetCycleAvailable":
                return produce(previous, draft => {
                    const {dataset, cycle} = action.payload;
                    draft.status.sync.datasets.push({
                        segments: [],
                        cycle, dataset
                    });
                });
            case "datasetCycleRemoved":
                return produce(previous, draft => {
                    const {dataset, cycle} = action.payload;
                    _.remove(draft.status.sync.datasets, status => status.dataset === dataset && status.cycle === cycle);
                });
            case "datasetCycleSegmentImported":
                return produce(previous, draft => {
                    const {dataset, cycle, segment} = action.payload,
                        {segments} = draft.status.sync.datasets.find(status => status.dataset === dataset && status.cycle === cycle);
                    segments.push(segment);
                });
            case "deviceIdAssigned":
                return produce(previous, draft => {
                    _.merge(draft.status, {
                        device: {
                            id: action.payload
                        }
                    });
                });
            case "devicePrefsChanged":
                return produce(previous, draft => {
                    const {prefs: {device}} = draft;
                    _.merge(device, action.payload);
                    if (!device.enableGeolocation) {
                        delete draft.status.position;
                    }
                });
            case "identityPrefsChanged":
                return produce(previous, draft => {
                    draft.prefs.identity = action.payload;
                });
            case "workerStatusChanged":
                return produce(previous, draft => {
                    draft.status.client.worker = action.payload;
                });
            case "onlineStatusChanged":
                return produce(previous, draft => {
                    draft.status.client.online = action.payload;
                });
            case "positionStatusChanged":
                return produce(previous, draft => {
                    const {status} = draft;
                    status.position = _.merge(status.position || {}, action.payload);
                    if (null == status.position.altitude) {
                        delete status.position.altitude;
                    }
                });
            case "stateRestored":
                return produce(previous, draft => {
                    const restored = action.payload,
                        {prefs, status: {device, position, sync}} = restored,
                        {device: {enableGeolocation}} = prefs;
                    _.merge(draft, {
                        status: {
                            device,
                            sync,
                            ...(enableGeolocation && position ? {position} : {})
                        },
                        prefs
                    });
                    const {auth: {retention}} = prefs;
                    if ("none" !== retention) {
                        const {auth} = restored,
                            {credentials} = auth;
                        if (null != credentials) {
                            const {username, password} = credentials;
                            if (null != username) {
                                draft.auth.credentials = {username};
                                if (null != password && "stayLoggedIn" === retention) {
                                    const {roles} = auth;
                                    draft.auth.credentials.password = password;
                                    draft.auth.roles.splice(0, draft.auth.roles.length,
                                        ...roles.filter(role => "fullyAuthenticated" !== role as string))
                                }
                            }
                        }
                    }
                    initializationComplete(draft, "state");
                });
            case "taskCompleted":
                return produce(previous, draft => {
                    delete draft.status.tasks[action.payload];
                });
            case "taskStarted":
                return produce(previous, draft => {
                    draft.status.tasks[action.payload.id] = castDraft(_.assign(_.cloneDeep(action.payload), {
                        started: nowUTC()
                    }));
                });
            case "taskUpdated":
                return produce(previous, draft => {
                    _.merge(draft.status.tasks[action.payload.id].status, action.payload.status);
                });
            case "visibleStatusChanged":
                return produce(previous, draft => {
                    draft.status.client.visible = action.payload;
                });
        }
        throw Error("Unsupported action.");
    }
}

function checkStandalone(env: Environment) {
    if ("_build" === env) {
        return false;
    }
    const {navigator} = window;
    if (window.matchMedia("(display-mode: standalone)").matches) {
        console.debug("Determined standalone state [true] via media query.");
        return true;
    } else if ("standalone" in navigator) {
        const standalone = !!navigator.standalone;
        console.debug(`Determined standalone state [${standalone}] via Navigator.`);
        return standalone;
    }
    console.debug("Returning standalone state [false] by default.");
    return false;
}

/**
 * Remove an item from the initialization task list (if it is present.) If the list becomes empty, set the `ready`
 * flag to `true`.
 *
 * @param draft the draft to update.
 * @param task the task to remove.
 * @private
 */
function initializationComplete(draft: WritableDraft<AppState>, task: ClientStatus["initializing"][number]) {
    const {status: {client: {initializing}}} = draft;
    if (initializing) {
        _.pull(initializing, task);
        if (_.isEmpty(initializing)) {
            const {status: {client}} = draft;
            delete client.initializing;
            client.ready = true;
        }
    }
}
