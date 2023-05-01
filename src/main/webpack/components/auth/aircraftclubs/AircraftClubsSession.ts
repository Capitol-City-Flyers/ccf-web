import {immerable} from "immer";
import {AircraftClubsAuthSuccess} from "./AircraftClubsClient";
import {AxiosHeaders, AxiosInstance, AxiosResponse} from "axios";
import {AircraftClubsResponseParser} from "../../../integrations/aircraftclubs/AircraftClubsResponseParser";
import {GetBookingsForCalendarResponse} from "../../../integrations/aircraftclubs/AircraftClubsResponseTypes";
import {Interval} from "luxon";
import {ValidInterval} from "../../../utils/DateUtils";

export class AircraftClubsSession {
    [immerable] = true;

    private parser = AircraftClubsResponseParser.INSTANCE;

    constructor(
        public loginResponse: AircraftClubsAuthSuccess,
        private axios: AxiosInstance
    ) {

    }

    getAddSquawkDialog(aircraftId: number, squawkId: number) {
        return this.axios.post<Document>("./functions/aircraft/getAddSquawkDialog.php", {
            squawkID: squawkId,
            aircraftID: aircraftId
        }, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetAddSquawkDialog(this, response.data);
        });
    }

    getAircraft(id: number) {
        return this.axios.post<Document>("./functions/aircraft/getAircraft.php", {a: "v", id}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetAircraft(this, response.data);
        });
    }

    getAircraftFiles(id: number) {
        return this.axios.post<Document>("./functions/file/getAircraftFiles.php", {a: id, m: "v"}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            /* TODO */
        });
    }

    getAircraftPhotos(id: number) {
        return this.axios.post<Document>("./functions/file/getAircraftPhotos.php", {aircraft: id}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            /* TODO */
        });
    }

    getBookingsForCalendar(aircraftId: number, range: Interval) {

        /* As best I can decipher it, AircraftClubs interprets the start/end dates as if they were the same local time
        but in the UTC zone, returning all bookings which fall at least partially into a day in that range. Convert
        start/end so the appropriate date(s) are covered, then post-filter to bookings actually in the range. */
        const {start, end} = range,
            {loginResponse: {timezone}} = this,
            adjustedStart = start!.setZone(timezone).setZone("utc", {keepLocalTime: true}),
            adjustedEnd = end!.setZone(timezone).setZone("utc", {keepLocalTime: true});
        return this.axios.get<GetBookingsForCalendarResponse>("./functions/booking/getBookingsForCalendar.php", {
            headers: new AxiosHeaders().setAccept("application/json"),
            params: {
                p: "",
                a: aircraftId,
                i: 0,
                e: 0,
                f: "s",
                start: Math.floor(adjustedStart.toSeconds()),
                end: Math.ceil(adjustedEnd.toSeconds()),
                _: Date.now()
            },
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetBookingsForCalendar(this, aircraftId, response.data)
                .filter(booking => booking.time.overlaps(range));
        });
    }

    getClubAircrafts() {
        return this.axios.post<Document>("./functions/aircraft/getClubAircrafts.php", {}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetClubAircrafts(this, response.data);
        });
    }

    getMaintenanceItems(id: number) {
        return this.axios.post<Document>("./functions/aircraft/getMaintenanceItems.php", {a: id, m: "v"}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetMaintenanceItems(this, response.data);
        });
    }

    getMakeBookingForm(id: number) {
        return this.axios.post<Document>("./functions/booking/getMakeBookingForm.php", {bookingID: id, f: "s"}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetMakeBookingForm(this, response.data);
        });
    }

    getMember(id: number) {
        return this.axios.post<Document>("./functions/member/getMember.php", {a: "e", id}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetMember(this, response.data);
        });
    }

    getMembers() {
        return this.axios.post<Document>("./functions/member/getMembers.php", {}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetMembers(this, response.data);
        });
    }

    getSquawkLog(id: number, tailNumber: string) {
        return this.axios.post<Document>("./functions/aircraft/getSquawkLog.php", {a: id, c: 0, tail: tailNumber}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetSquawkLog(this, response.data);
        });
    }

    getUpcomingBookings(id: number) {
        return this.axios.post<Document>("./functions/booking/getUpcomingBookings.php", {p: id}, {
            headers: new AxiosHeaders()
                .setAccept("text/html")
                .setContentType("application/x-www-form-urlencoded"),
            responseType: "document"
        }).then(response => {
            expectStatus(response, 200);
            return this.parser.parseGetUpcomingBookings(this, response.data);
        });
    }

    /**
     * Send a logout request to AircraftClubs. The browser will have received a `PHPSESSID` cookie during the preceding
     * login request, which it will send with the logout request.
     */
    public logout() {
        return this.axios.post("./functions/authentication/logout.php", {}, {
            headers: new AxiosHeaders()
                .setContentType("application/x-www-form-urlencoded")
        }).then(response => {
            expectStatus(response, 200);
            console.debug("AircraftClubs logout was successful.");
        }).catch(ex => {
            console.error(`AircraftClubs logout error.`, ex);
        });
    }
}

function expectStatus(response: AxiosResponse, first: number, ...additional: Array<number>) {
    const {status} = response;
    if (status !== first && -1 === additional.indexOf(status)) {
        const error = `AircraftClubs [${response.request.url.split("/").pop}] request returned unexpected response ${status}.`;
        console.error(error, response);
        throw Error(error);
    }
    return status;
}
