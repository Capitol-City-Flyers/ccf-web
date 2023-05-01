import Axios, {AxiosHeaders, AxiosInstance} from "axios";
import {freeze, immerable} from "immer";
import {TailNumber} from "../../../data";
import {Role} from "../../../state/AppState";
import {AuthResponse, AuthSuccess, UserCredentials} from "../../../types/AuthTypes";
import {AircraftClubsSession} from "./AircraftClubsSession";

/**
 * {@link AircraftClubsClient} encapsulates the process of communicating with AircraftClubs through the AircraftClubs
 * proxy.
 *
 * In development, the AircraftClubs proxy is implemented through the `/api/aicraftclubs/*` endpoints. In production,
 * this may be different (TBD.) We can't talk to AircraftClubs directly (from a browser) due to CORS policy.
 */
export class AircraftClubsClient {
    [immerable] = true;

    private readonly axios: AxiosInstance;

    private constructor(
        /**
         * Base URL of the AircraftClubs API proxy.
         */
        baseUrl: URL
    ) {
        this.axios = Axios.create({
            baseURL: baseUrl.href
        });
    }

    /**
     * Attempt to authenticate user credentials via AircraftClubs. Performs a login/logout cycle, returning an
     * {@link AuthResponse} describing the outcome.
     *
     * @param credentials the user credentials.
     */
    authenticate(credentials: UserCredentials): Promise<AuthResponse> {
        return this.login(credentials)
            .then(session => {
                session.logout().then();
                return this.toAuthSuccess(session.loginResponse);
            })
            .catch(error => freeze({
                kind: "authentication failure",
                error
            }));
    }

    /**
     * Send a login request to AircraftClubs. If successful, the browser will receive a `PHPSESSID` cookie which it will
     * send with subsequent requests until logout. Throws {@link Error} with the error message from the response on
     * failure.
     *
     * @param credentials the user credentials.
     * @private
     */
    public login(credentials: UserCredentials) {
        const {password, username} = credentials,
            {axios} = this;
        return axios.post<AircraftClubsAuthResponse>("./functions/authentication/login.php", {password, username}, {
            headers: new AxiosHeaders()
                .setAccept("application/json")
                .setContentType("application/x-www-form-urlencoded")
        }).then(response => {
            const {data} = response;
            if (isAircraftClubsAuthFailure(data)) {
                const {error} = data;
                throw Error(error);
            }
            return freeze(new AircraftClubsSession(data, axios));
        });
    }

    /**
     * Produce an {@link AuthSuccess} from the raw contents of a successful AircraftClubs authentication response.
     *
     * @param response the response.
     * @private
     */
    private toAuthSuccess(response: AircraftClubsAuthSuccess): AuthSuccess {
        const {email, firstName, lastName, personID, username, permissions} = response,
            trimmedFirstName = firstName?.trim() || null,
            trimmedLastName = lastName?.trim() || null,
            trimmedUsername = username.trim();
        let displayName;
        if (null != trimmedFirstName && null != trimmedLastName) {
            displayName = `${firstName} ${lastName.substring(0, 1)}`;
        } else if (null != trimmedFirstName) {
            displayName = trimmedFirstName;
        } else if (null != trimmedLastName) {
            displayName = trimmedLastName;
        } else {
            displayName = trimmedUsername;
        }
        return {
            kind: "authentication success",
            identity: {
                userId: personID.trim(),
                displayName, email, firstName, lastName, username
            },
            roles: [
                "authenticated",
                "fullyAuthenticated",
                ...permissions.split(",")
                    .map(perm => perm.trim())
                    .filter(perm => perm in rolesByPermission)
                    .map(perm => rolesByPermission[perm])
            ]
        };
    }

    static create(baseUrl: URL) {
        return freeze(new AircraftClubsClient(baseUrl));
    }
}

/**
 * Map of permission values in the AircraftClubs login response to corresponding {@link Role} values.
 */
const rolesByPermission: { [perm in string]: Role } = freeze({
    1: "superAdmin",
    2: "siteAdmin",
    14: "maintenanceAdmin",
    15: "scheduleAdmin",
    16: "memberAdmin",
    20: "reportViewer",

    /* Note: 98/99 don't seem to come back correctly in the login response, they may be reversed. The values on the edit
    roles page are 98=member and 99=guest, but my account has "member" role, NOT "guest" role, while login returns 99
    but NOT 98 for me. */
    98: "guest",
    99: "member"
    // 98: "member",
    // 99: "guest"
});

/**
 * Possible responses from a request to the `./authenticate` endpoint of the AircraftClubs proxy.
 */
type AircraftClubsAuthResponse =
    | AircraftClubsAuthFailure
    | AircraftClubsAuthSuccess;

/**
 * Type guard for {@link AircraftClubsAuthFailure}.
 *
 * @param value the value to check.
 */
function isAircraftClubsAuthFailure(value: any): value is AircraftClubsAuthFailure {
    return "object" === typeof value
        && "error" in value;
}

/**
 * Raw contents of a failed authentication response from the AircraftClubs proxy.
 */
interface AircraftClubsAuthFailure {
    error: string;
}

/**
 * Raw contents of a successful authentication response from the AircraftClubs proxy (which passes the body through
 * unmodified.)
 */
export interface AircraftClubsAuthSuccess {
    JSDateFormat: string;
    JSTimeFormat: string;
    allowCheckout: "0" | "1";
    allowEditFlightMedical: "0" | "1";
    allowEmail: "0" | "1";
    clubID: string;
    defaultAircraftID: string;
    defaultEquipmentID: "0" | string;
    defaultInstructorID: "0" | string;
    email: string;
    firstName: string;
    lastName: string;
    permissions: string;
    personID: string;
    sessionID: string;
    startAtHome: "0" | "1";
    success: "0" | "1";
    timezone: string;
    username: string;
    valid: 0 | 1;
}

/**
 * Basic summary of an AircraftClubs booking.
 */
export interface AircraftClubsBooking {
    id: number;
    personId: number;
    endDateTime: Date;
    startDateTime: Date;
    tailNumber: TailNumber;
}

/**
 * Full detail of an AircraftClubs booking.
 */
export interface AircraftClubsBookingDetail {
    id: number;
    aircraftId: number;
    personId: number;
    backup: boolean;
    comments: null | string;
    destination: null | string;
    endDateTime: Date;
    maintenance: boolean;
    shared: boolean;
    startDateTime: Date;
}