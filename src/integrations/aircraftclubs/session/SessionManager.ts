import {freeze} from "immer";
import _ from "lodash";
import {AircraftClubsSession} from "./AircraftClubsSession";
import {isLoginSuccess} from "../aircraftclubs-types";
import type {BasicCredentials} from "../../../providers/app/app-types";
import type {AircraftClubsClient} from "../AircraftClubsClient";

/**
 * {@link SessionManager} manages a "session" with the AircraftClubs API, logging in and out as necessary. Logs in
 * (receiving a `PHPSESSID` which will be managed by the browser) when a request is made without an active session. Logs
 * out after some period of inactivity, currently two minutes.
 */
export class SessionManager {

    private readonly closeSessionWhenIdle: () => void;
    private readonly holder: SessionHolder;

    private constructor(private client: AircraftClubsClient, private credentials: BasicCredentials) {
        let currentSession: AircraftClubsSession | null = null;
        this.holder = {
            clear: () => {
                currentSession = null
            },
            get: () => currentSession,
            set: session => currentSession = session
        }
        this.closeSessionWhenIdle = _.debounce(() => {
            if (null == currentSession) {
                return Promise.resolve();
            }
            currentSession.logout()
                .then(() => {
                    console.debug("Closed AircraftClubs session.")
                    currentSession = null
                });
        }, 2 * 60 * 1_000);
    }

    async useSession(): Promise<AircraftClubsSession> {
        const {holder} = this,
            existingSession = holder.get();
        if (null == existingSession) {
            const {client, credentials} = this,
                {data: response} = await client.login(credentials);
            if (!isLoginSuccess(response)) {
                throw Error("Login failed.");
            }
            holder.set(AircraftClubsSession.create(client, response));
            console.debug("Opened AircraftClubs session.");
        }
        return Promise.resolve(holder.get())
            .finally(() => {
                this.closeSessionWhenIdle();
            });
    }

    /**
     * Create a {@link SessionManager} instance.
     *
     * @param client the AircraftClubs API client.
     * @param credentials the user credentials.
     */
    static create(client: AircraftClubsClient, credentials: BasicCredentials) {
        return freeze(new SessionManager(client, credentials), true);
    }
}

/**
 * Interface to an object through which the active session is shared.
 */
interface SessionHolder {
    clear(): void;

    get(): null | AircraftClubsSession;

    set(session: AircraftClubsSession): void;
}
