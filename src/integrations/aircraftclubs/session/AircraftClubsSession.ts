import {freeze} from "immer";
import {IANAZone, Interval, Zone} from "luxon";
import {LoginSuccess} from "../aircraftclubs-types";
import {AircraftClubsClient} from "../AircraftClubsClient";
import {ResponseParser} from "./ResponseParser";
import type {AircraftConfig} from "../../../config-types";

export class AircraftClubsSession {
    readonly zone: Zone;
    private readonly parser: ResponseParser;

    private constructor(private client: AircraftClubsClient, private login: LoginSuccess) {
        this.parser = ResponseParser.create(login);
        this.zone = IANAZone.create(login.timezone);
    }

    async getBookingsForCalendar(aircraft: AircraftConfig, range: Interval) {
        const {client, parser, zone} = this,
            response = await client.getBookingsForCalendar(aircraft, range, zone);
        return parser.parseGetBookingsForCalendarResponse(response.data, aircraft);
    }

    async getMembers() {
        const {data} = await this.client.getMembers();
        return this.parser.parseGetMembers(data);
    }

    async logout() {
        return this.client.logout();
    }

    static create(client: AircraftClubsClient, login: LoginSuccess) {
        return freeze(new AircraftClubsSession(client, login), true);
    }
}
