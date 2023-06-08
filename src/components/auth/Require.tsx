import {ComponentType, PropsWithChildren, useCallback, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {isRole} from "../../providers/app/app-types";
import AccessDenied from "./AccessDenied";
import type {AuthResult, Role} from "../../providers/app/app-types";
import {useApp, useRoles} from "../../providers/app/AppContext";

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
     * Flag indicating whether authentication should be triggered if one of the following roles is *required* but has
     * not been *granted* to the current user:
     * * `authenticated`
     * * `fullyAuthenticated`
     * * `identified`
     */
    authenticate?: true;

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
    const {authenticate, otherwise, ...roleSpec} = props,
        {env} = useApp(),
        {missingRoles} = useRoles(),
        required = useMemo(() =>
            freeze(_.sortedUniq(_.transform(Object.entries(roleSpec), (roles, [role, value]) => {
                if (isRole(role) && true === value) {
                    roles.push(role);
                }
            }, new Array<Role>()))), [...Object.keys(roleSpec)]);

    /* Authentication challenge/access denied callbacks. */
    const onAccessDeniedRetry = useCallback(() => {
        console.debug("retry login.");
    }, []);
    const onLoginChallengeComplete = useCallback((result: AuthResult) => {
        console.debug("login challenge complete.", result);
    }, []);

    /* Nothing to check if no roles were required. */
    if (0 === required.length) {
        console.debug("No roles required.");
        return (<>{children}</>);
    }

    /* At least one role was required. */
    const missing = missingRoles(required);
    if (0 === missing.length) {
        console.debug(`No missing roles in [${required.join("], [")}].`);
        return (<>{children}</>);
    }

    /* At least one role was missing. During static page build, suppress content. */
    const missingList = _.sortedUniq(missing).join("], [");
    if ("_build" === env) {
        console.debug(`Suppressing content during static build due to missing role(s) [${missingList}].`)
        return null;
    }

    /* Render the appropriate "access denied" component. */
    if (null == otherwise) {
        console.debug(`Suppressing content due to missing role(s) [${missingList}].`);
        return null;
    }
    if ("deny" === otherwise) {
        console.debug(`Rendering default access denied component due to missing role(s) [${missingList}].`);
        return (<AccessDenied allowRetry required={required} onRetry={onAccessDeniedRetry}/>);
    }
    console.debug(`Rendering custom access denied component due to missing role(s) [${missingList}].`, otherwise);
    const DeniedComponent = otherwise;
    return (<DeniedComponent missing={missing} required={required}/>);
}
