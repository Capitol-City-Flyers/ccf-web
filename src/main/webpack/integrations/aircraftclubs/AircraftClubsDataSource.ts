import {freeze, immerable} from "immer";
import _ from "lodash";
import {Interval} from "luxon";
import {AircraftClubsSession} from "../../components/auth/aircraftclubs/AircraftClubsSession";
import {CLUB_DATA, TailNumber} from "../../data";
import {ClubAircraft, ClubDataSource, ClubMember, ClubReservation} from "../IntegrationTypes";
import {SessionManager} from "./SessionManager";
import {DateCalc} from "../../utils/DateCalc";

type ClubDataAircraftArray = typeof CLUB_DATA["aircraft"];
type ClubDataAircraft = ClubDataAircraftArray[number];

/**
 * {@link AircraftClubsDataSource} implements {@link ClubDataSource} by accessing AircraftClubs web service
 * endpoints directly.
 */
export class AircraftClubsDataSource implements ClubDataSource {
    [immerable] = true;

    /**
     * Aircraft data from static configuration, keyed on tail number.
     *
     * @private
     */
    private aircraftConfigByTailNumber: { [tailNumber in TailNumber]: ClubDataAircraft }

    private constructor(private sessionManager: SessionManager) {
        this.aircraftConfigByTailNumber = freeze(Object.fromEntries(CLUB_DATA.aircraft.map(aircraft =>
            [aircraft.tailNumber as TailNumber, aircraft])));
    }

    getAircraft(id: number) {
        return this.sessionManager.withSession(session => this.doGetAircraft(session, id));
    }

    getAircraftMaintenanceItems(id: number) {
        return this.sessionManager.withSession(session => this.doGetAircraftMaintenanceItems(session, id));
    }

    getAircraftReservations(id: number, range: Interval) {
        return this.sessionManager.withSession(session =>
            this.doGetAircraftReservations(session, id, range));
    }

    getAircraftSquawks(id: number) {
        return this.sessionManager.withSession(session => this.doGetAircraftSquawks(session, id));
    }

    getAllAircraft() {
        return this.sessionManager.withSession(session => this.doGetAllAircraft(session));
    }

    getAllAircraftDetails() {
        const {aircraftConfigByTailNumber} = this;
        return this.sessionManager.withSession(async session => {
            const aircraft = await this.doGetAllAircraft(session);
            return aircraft.map(next => ({
                ...next,
                modeSCode: aircraftConfigByTailNumber[next.tailNumber]?.modeSCode || null
            }))
        });
    }

    getAllMembers() {
        return this.sessionManager.withSession(session => this.doGetAllMembers(session));
    }

    getMemberFutureReservations(id: number) {
        return this.sessionManager.withSession(session => this.doGetMemberFutureReservations(session, id));
    }

    getMemberDetails(id: number) {
        return this.sessionManager.withSession(session => this.doGetMemberDetails(session, id));
    }

    private async doGetAircraft(session: AircraftClubsSession, id: number) {
        const aircraft = await session.getAircraft(id);
        return freeze<ClubAircraft>(_.pick(aircraft, ["id", "airframe", "tailNumber"]));
    }

    private async doGetAircraftMaintenanceItems(session: AircraftClubsSession, id: number) {
        return session.getMaintenanceItems(id);
    }

    private async doGetAircraftReservations(session: AircraftClubsSession, id: number, range: Interval) {
        return session.getBookingsForCalendar(id, range);
    }

    private async doGetAircraftSquawks(session: AircraftClubsSession, id: number) {
        const {tailNumber} = await this.doGetAircraft(session, id),
            squawks = await session.getSquawkLog(id, tailNumber);
        return Promise.all(squawks.map(({id: squawkId}) => session.getAddSquawkDialog(id, squawkId)));
    }

    private async doGetAllAircraft(session: AircraftClubsSession) {
        const allAircraft = await session.getClubAircrafts();
        return freeze(await Promise.all(allAircraft.map(({id}) =>
            this.doGetAircraft(session, id))));
    }

    private async doGetAllMembers(session: AircraftClubsSession) {
        const members = await session.getMembers();
        return freeze<Array<ClubMember>>(members.map(member => {
            const {fullName, mobile} = member,
                nameParts = fullName.split(",").map(_.trim).reverse(),
                displayName = 1 === nameParts.length
                    ? nameParts[0]
                    : `${nameParts[0]} ${nameParts[1].substring(0, 1)}`;
            return {
                ..._.pick(member, "id", "email", "status"),
                firstName: nameParts[0]!,
                lastName: nameParts.length < 2 ? null : nameParts[1],
                phone: mobile,
                displayName
            };
        }));
    }

    private async doGetMemberDetails(session: AircraftClubsSession, id: number) {
        return await session.getMember(id);
    }

    private doGetMemberFutureReservations(session: AircraftClubsSession, id: number) {
        const dates = DateCalc.create(session.loginResponse.timezone);
        return session.getUpcomingBookings(id).then(bookings =>
            Promise.all(bookings.map(({id}) => session.getMakeBookingForm(id)))
                .then(details =>
                    freeze<Array<ClubReservation>>(details.map(detail => ({
                        id: detail.id,
                        aircraftId: detail.aircraftId,
                        memberId: detail.personId,
                        maintenance: detail.maintenance,
                        shared: detail.shared,
                        time: dates.toDateTime(detail.startDateTime).until(dates.toDateTime(detail.endDateTime))
                    })))));
    }

    static create(sessionManager: SessionManager) {
        return freeze(new AircraftClubsDataSource(sessionManager), true);
    }
}
