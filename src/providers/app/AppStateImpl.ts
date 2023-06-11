import {castDraft, freeze, immerable, produce} from "immer";
import _ from "lodash";
import {nowUTC} from "../../utilities/date-utils";
import type {Config, Environment} from "../../config-types";
import type {AppState, AppStateAction, AuthState, PrefsState, StatusState, StoredAppState} from "./app-types";

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
            case "onlineStatusChanged":
                return produce(previous, draft => {
                    draft.status.online = action.payload;
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
                        {prefs, status: {device, position}} = restored,
                        {device: {enableGeolocation}} = prefs;
                    _.merge(draft, {
                        status: {
                            device,
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
                    draft.status.visible = action.payload;
                });
        }
        throw Error("Unsupported action.");
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
            prefs: config.defaults.prefs,
            status: {
                online: !build && window.navigator.onLine,
                visible: !build && "visible" === window.document.visibilityState,
                tasks: {}
            }
        })), true);
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
            status: _.pick(status, ["device", ...[enableGeolocation ? "position" : []]])
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
}
