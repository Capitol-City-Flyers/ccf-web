import {freeze, immerable} from "immer";
import {Auth, Prefs} from "../../state/AppState";
import {getJsonItem, setJsonItem} from "../../utils/StorageUtils";

export class StorageService {
    [immerable] = true;

    private constructor(private storage: Storage) {

    }

    removeAuth() {
        this.storage.removeItem("auth");
    }

    removePrefs() {
        this.storage.removeItem("prefs");
    }

    retrieveAuth(): null | Auth {
        const stored = getJsonItem<StoredState<Auth>>(this.storage, "auth");
        if (null == stored) {
            return null;
        }
        return {
            ...stored.state,
            roles: stored.state.roles.filter(role => "fullyAuthenticated" !== role)
        };
    }

    retrievePrefs(): null | Prefs {
        return getJsonItem<StoredState<Prefs>>(this.storage, "prefs")?.state || null;
    }

    storeAuth(auth: Auth) {
        setJsonItem(this.storage, "auth", {
            format: 0,
            timestamp: Date.now(),
            state: {
                ...auth,
                roles: auth.roles.filter(role => "fullyAuthenticated" !== role)
            }
        });
    }

    storePrefs(prefs: Prefs) {
        setJsonItem(this.storage, "prefs", {
            format: 0,
            timestamp: Date.now(),
            state: prefs
        });
    }

    static create(storage: Storage) {
        return freeze(new StorageService(storage));
    }
}

interface StoredState<T> {
    format: 0;
    timestamp: number;
    state: T;
}
