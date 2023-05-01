import {DateRange} from "../utils/DateUtils";
import {DateTime, Interval} from "luxon";

/**
 * {@link ClubDataSource} is the core service which provides access to live club data. Data may come from synchronized
 * local storage, a server-side database, in-memory cache, web service invocations, or any other suitable source or
 * combination of sources.
 */
export interface ClubDataSource {

    getAircraft(id: number): Promise<ClubAircraft>;

    getAircraftMaintenanceItems(id: number): Promise<Array<ClubAircraftMaintenanceItem>>;

    getAircraftReservations(id: number, range: Interval): Promise<Array<ClubReservationOverview>>;

    getAircraftSquawks(id: number): Promise<Array<ClubAircraftSquawk>>;

    getAllAircraft(): Promise<Array<ClubAircraft>>;

    getAllAircraftDetails(): Promise<Array<ClubAircraftDetails>>;

    getAllMembers(): Promise<Array<ClubMember>>;

    getMemberDetails(id: number): Promise<ClubMemberDetails>;

    /**
     * Get all future reservations for a member, ordered by ascending start date/time.
     *
     * @param id the member identifier.
     */
    getMemberFutureReservations(id: number): Promise<Array<ClubReservation>>;
}

export interface ClubAircraft {
    id: number;
    airframe: {
        model: string;
        year: null | number;
    };
    tailNumber: string;
}

export interface ClubAircraftDetails extends ClubAircraft {
    modeSCode: null | string;
}

export interface ClubAircraftMaintenanceItem {
    id: number;
    description: string;
    due:
        | { hours: number; }
        | { date: string; };
    frequency: {
        unit: "hour" | "month";
        interval: number;
    };
    performed: {
        date: string;
        hours: null | number;
    };
}

export interface ClubAircraftSquawk {
    id: number;
    aircraftId: number;
    memberId: number;
    attachmentIds: Array<number>;
    comments: null | string;
    description: number;
    date: string;
    ground: boolean;
    status: "open" | "closed";
}

export interface ClubMember {
    id: number;
    displayName: string;
    email: null | string;
    firstName: string;
    lastName: null | string;
    phone: null | string;
    status: "active" | "deleted" | "inactive" | "locked";
}

export interface ClubMemberAircraft {
    id: number;

}

export interface ClubMemberDetails {
    id: number;
    address: {
        street: string;
        street2: null | string;
        city: string;
        postalCode: string;
        state: string;
        country: string;
    };
    aircraft: Array<{
        id: number;
        preferred: boolean;
        selected: boolean;
    }>;
    certificate: null | {
        issueDate: string;
        number: string;
    };
    clubReviewDueDate: null | string;
    displayName: string;
    firstName: string;
    flightReviewDueDate: null | string;
    emailAddresses: Array<string>;
    emergencyContact: null | {
        name: string;
        phone: string;
    };
    lastAccessDateTime: null | Date;
    lastName: null | string;
    medicalCertificate: null | {
        dueDate: string;
    };
    memberships: Array<{
        type: "aopa";
        number: string;
    }>;
    phoneNumbers: Array<{
        type: "home" | "mobile" | "work";
        number: string;
    }>;
}

type PhoneNumbers = ClubMemberDetails["phoneNumbers"];
type PhoneNumber = PhoneNumbers[number];
export type PhoneNumberType = PhoneNumber["type"];

export interface ClubReservation {
    id: number;
    aircraftId: number;
    memberId: number;
    maintenance: boolean;
    shared: boolean;
    time: Interval;
}

export interface ClubReservationOverview {
    id: number;
    aircraftId: number;
    time: Interval;
}

export interface WeatherDataSource {
    getSiteForecast(site: string): Promise<Forecast | null>;
}

export interface WindLayerElement {
    kind: "wind layer";

    /**
     * Feet MSL, `undefined` for surface.
     */
    altitude?: number;

    /**
     * True degrees.
     */
    direction: number;

    /**
     * Knots.
     */
    speed: number;

    /**
     * Knots.
     */
    gust?: number;
}

export interface Phenomenon {
    "kind": "phenomenon";

    type: "rain" | "snow" | "thunderstorm";
}

export interface VisibilityElement {
    kind: "visibility";

    /**
     * Statute miles.
     */
    distance: number;
}

export interface CloudLayerElement {
    kind: "cloud layer";

    coverage: "few" | "scattered" | "broken" | "overcast";

    /**
     * Feet MSL.
     */
    height: number;
}

type ForecastElement =
    | CloudLayerElement
    | WindLayerElement
    | VisibilityElement;

export interface Forecast {
    effective: Interval;
    issued: DateTime;
    periods: Array<{
        interval: Interval;
        elements: Array<ForecastElement>;
        probability?: number;
        transition: Interval;
    }>;
}
