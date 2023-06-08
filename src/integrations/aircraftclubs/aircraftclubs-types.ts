/**
 * Possible responses from a request to the `./authenticate` endpoint of the AircraftClubs proxy.
 */
export type LoginResponse =
    | LoginIncorrect
    | LoginSuccess;

/**
 * Raw contents of a failed authentication response from the AircraftClubs proxy.
 */
interface LoginIncorrect {
    success: "incorrect";
}

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

/**
 * Response from `./functions/member/getMembers.php`.
 */
export type GetMembersResponse = Array<{
    id: number;
    email: null | string;
    mobile: null | string;
    fullName: string;
    status:
        | "active"
        | "deleted"
        | "inactive"
        | "locked";
}>;

/**
 * Raw contents of a successful authentication response from the AircraftClubs proxy (which passes the body through
 * unmodified.)
 */
export interface LoginSuccess {
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
    success: "1";
    timezone: string;
    username: string;
    valid: 0 | 1;
}

/**
 * Type guard for {@link LoginIncorrect}.
 *
 * @param value the value to check.
 */
export function isLoginIncorrect(value: any): value is LoginIncorrect {
    return "object" === typeof value
        && "success" in value
        && "incorrect" === value.success;
}

/**
 * Type guard for {@link LoginSuccess}.
 *
 * @param value the value to check.
 */
export function isLoginSuccess(value: any): value is LoginSuccess {
    return "object" === typeof value
        && "success" in value
        && "1" === value.success;
}
