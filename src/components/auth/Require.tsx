import {ComponentType, PropsWithChildren, useCallback, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {isRole} from "../../providers/app/app-types";
import AccessDenied from "./AccessDenied";
import type {AuthResult, Role} from "../../providers/app/app-types";
import {useApp, useRoles} from "../../providers/app/AppContext";
import Enforce from "./Enforce";
import {OidcSecure} from "@axa-fr/react-oidc";

/**
 * Required roles for a [Require] component.
 */
type RequireRoles = Partial<{
    [R in Role]: true
}>;

/**
 * Properties for a [Require] component.
 */
interface RequireProps {
    /**
     * Component to display if the role requirement is not met. If not present, nothing is rendered.
     */
    otherwise?:
        | "deny"
        | ComponentType<DeniedComponentProps>;
}

/**
 * Properties for a component to be displayed when a role requirement is *not* met.
 */
interface DeniedComponentProps {

    /**
     * Roles which were *required* but were not *granted* to the user.
     */
    missing: Array<Role>;

    /**
     * Roles which were *required*.
     */
    required: Array<Role>;
}

/**
 * [Require] enforces a role requirement on its child content, either by suppressing the content or by displaying an
 * *access denied* component, depending on component properties.
 *
 * @param children the child element(s).
 * @param props the component properties.
 */
export default function ({children, ...props}: PropsWithChildren<RequireProps & RequireRoles>) {
    const {otherwise, ...roleSpec} = props,
        {env} = useApp(),
        {missingRoles} = useRoles(),
        required = useMemo(() =>
            freeze(_.sortedUniq(_.transform(Object.entries(roleSpec), (roles, [role, value]) => {
                if (isRole(role) && true === value) {
                    roles.push(role);
                }
            }, new Array<Role>()))), [...Object.keys(roleSpec)]);
    if ("_build" === env || null == required.find(role => "guest" !== role)) {
        return (
            <Enforce roles={required}>
                {children}
            </Enforce>
        );
    }
    return (
        <OidcSecure>
            <Enforce roles={required}>
                {children}
            </Enforce>
        </OidcSecure>
    );
}
