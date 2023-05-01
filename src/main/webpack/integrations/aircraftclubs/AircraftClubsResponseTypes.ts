import {TailNumber} from "../../data";
import {ClubAircraftMaintenanceItem, ClubAircraftSquawk, ClubMember, ClubMemberDetails} from "../IntegrationTypes";

export type BillingUnit = "hour";
export type BillingSource = "hobbs" | "tach";

export type GetAddSquawkDialogResponse = ClubAircraftSquawk;

/**
 * Response from `./functions/aircraft/getAircraft.php`.
 */
export interface GetAircraftResponse {
    id: number;
    airframe: {
        model: string;
        year: number;
    };
    billing: null | {
        unit: BillingUnit;
        currency: "USD";
        rate: number;
        source: BillingSource;
        includesFuel: boolean;
    };
    description: string;
    engine: string;
    equipment: null | string;
    location: null | string;
    reservationNotes: null | string;
    rules: "ifr" | "vfr";
    tailNumber: string;
}

/**
 * Response from `./functions/aircraft/getClubAircrafts.php`.
 */
export type GetClubAircraftsResponse = Array<{
    id: number;
    description: string;
    model: string;
    tailNumber: TailNumber;
}>;

export type GetMaintenanceItemsResponse = Array<ClubAircraftMaintenanceItem>;

export type GetMemberResponse = ClubMemberDetails;

/**
 * Response from `./functions/member/getMembers.php`.
 */
export type GetMembersResponse = Array<{
    id: number;
    email: null | string;
    mobile: null | string;
    fullName: string;
    status: ClubMember["status"];
}>;

/**
 * Response from `./functions/booking/getBookingsForCalendar.php`.
 */
export type GetBookingsForCalendarResponse = Array<{
    id: string;
    allDay: boolean;
    color: string;
    end: string;
    fromTime: string;
    icon: string;
    logging: boolean;
    loggingTime: string;
    multiDay: boolean;
    start: string;
    textColor: string;
    title: string; /* HTML */
    tooltip: string;
    sharing: "true" | "false";
}>;

export type GetSquawkLogResponse = Array<{
    id: number;
    timestamp: Date;
    date: string;
    description: string;
}>;
