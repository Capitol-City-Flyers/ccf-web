import {Auth, Role} from "../state/AppState";

export interface Security {
    member: boolean;
    visitor: boolean;
    hasAll(first: Role, ...additional: Array<Role>): boolean;
}

/**
 * Credentials for user authentication.
 */
export interface UserCredentials {
    username: string;
    password: string;
}

/**
 * Possible responses to an authentication request.
 */
export type AuthResponse =
    | AuthFailure
    | AuthSuccess;

/**
 * Type guard for {@link AuthFailure}.
 *
 * @param value the value to check.
 */
export function isAuthFailure(value: any): value is AuthFailure {
    return "object" === typeof value
        && "kind" in value
        && "authentication failure" == value["kind"];
}

/**
 * Authentication was successful.
 */
export interface AuthSuccess {
    kind: "authentication success";
    identity: Exclude<Auth["identity"], null>;
    roles: Array<Role>;
}

/**
 * Authentication failed, probably bad username and/or password.
 */
export interface AuthFailure {
    kind: "authentication failure";
    error: Exclude<any, null>;
}
