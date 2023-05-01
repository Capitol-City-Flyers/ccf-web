import {AircraftClubsSession} from "../../components/auth/aircraftclubs/AircraftClubsSession";
import {UserCredentials} from "../../types/AuthTypes";
import {AircraftClubsClient} from "../../components/auth/aircraftclubs/AircraftClubsClient";
import _ from "lodash";
import {freeze, immerable} from "immer";

type CredentialsSource = () => UserCredentials;

interface SessionHolder {
    clear(): void;

    get(): null | AircraftClubsSession;

    set(session: AircraftClubsSession): void;
}

export class SessionManager {
    [immerable] = true;

    private readonly closeSession: () => void;
    private holder: SessionHolder;

    private constructor(private client: AircraftClubsClient, private credentialsSource: CredentialsSource) {
        let currentSession: null | AircraftClubsSession = null;
        this.holder = {
            get: () => currentSession,
            set: session => currentSession = session
        }
        this.closeSession = () => {
            const {session} = this;
            if (null != session) {
                currentSession = null;
                session.logout().then();
            }
        };
    }

    async withSession<T>(callback: (session: AircraftClubsSession) => Promise<T>): Promise<T> {
        const {holder} = this,
            existingSession = holder.get();
        if (null == existingSession) {
            const credentials = this.credentialsSource();
            if (null == credentials) {
                throw Error("Credentials not available.");
            }
            holder.set(await this.client.login(credentials));
        }
        const result = await (callback(holder.get()));
        _.debounce(this.closeSession, 5 * 60 * 1000);
        return result;
    }

    static create(client: AircraftClubsClient, credentialsSource: CredentialsSource) {
        return freeze(new SessionManager(client, credentialsSource), true);
    }
}
