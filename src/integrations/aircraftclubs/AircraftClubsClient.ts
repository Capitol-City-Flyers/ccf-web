import {AxiosHeaders, AxiosInstance} from "axios";
import {freeze} from "immer";
import _ from "lodash";
import {validateIn} from "../../utilities/array-utils";
import type {BasicCredentials} from "../../providers/app/app-types";
import type {GetBookingsForCalendarResponse, LoginResponse} from "./aircraftclubs-types";
import {Interval, Zone} from "luxon";
import {AircraftConfig} from "../../config-types";

/**
 * [AircraftClubsClient] encapsulates all HTTP access to `aircraftclubs.com`.
 */
export class AircraftClubsClient {
    private constructor(private axios: AxiosInstance) {
    }

    async authenticate(credentials: BasicCredentials) {
        return this.login(credentials)
            .finally(() => this.logout())
            .then(({data}) => data)
    }

    async getBookingsForCalendar(aircraft: AircraftConfig, range: Interval, zone: Zone) {
        /* As best I can decipher it, AircraftClubs interprets the start/end dates as if they were the same local time
        but in the UTC zone, returning all bookings which fall at least partially into a day in that range. Convert
        start/end so the appropriate date(s) are covered, then post-filter to bookings actually in the range. */
        const {start, end} = range,
            adjustedStart = start!.setZone(zone).setZone("utc", {keepLocalTime: true}),
            adjustedEnd = end!.setZone(zone).setZone("utc", {keepLocalTime: true});
        return this.axios.get<GetBookingsForCalendarResponse>("./functions/booking/getBookingsForCalendar.php", {
            headers: new AxiosHeaders().setAccept("application/json"),
            params: {
                p: "",
                a: parseInt(aircraft.refs.aircraftClubs, 10),
                i: 0,
                e: 0,
                f: "s",
                start: Math.floor(adjustedStart.toSeconds()),
                end: Math.ceil(adjustedEnd.toSeconds()),
                _: Date.now()
            },
            validateStatus: validateIn(200)
        });
    }

    async getMembers() {
        return this.axios.post<Document>("./functions/member/getMembers.php", {}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document",
            validateStatus: validateIn(200)
        });
    }

    async login(credentials: BasicCredentials) {
        const params = _.pick(credentials, "password", "username");
        return this.axios.post<LoginResponse>("./functions/authentication/login.php", params, {
            headers: new AxiosHeaders()
                .setAccept("application/json")
                .setContentType("application/x-www-form-urlencoded"),
            validateStatus: validateIn(200)
        });
    }

    async logout() {
        await this.axios.post<Document>("./functions/authentication/logout.php", {}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            validateStatus: validateIn(200)
        });
    }

    static create(axios: AxiosInstance) {
        return freeze(new AircraftClubsClient(axios), true);
    }
}
