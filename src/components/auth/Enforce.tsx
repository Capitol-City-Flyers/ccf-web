import {PropsWithChildren} from "react";
import {Role} from "../../providers/app/app-types";
import {useRoles} from "../../providers/app/AppContext";

interface EnforceProps {
    roles: Array<Role>;
}

export default function Enforce(props: PropsWithChildren<EnforceProps>) {
    const {children, roles} = props,
        {missingRoles} = useRoles();

    /* Nothing to check if no roles were required. */
    if (0 === roles.length) {
        console.debug("No roles required.");
        return (<>{children}</>);
    }

    /* At least one role was required. */
    const missing = missingRoles(roles);
    if (0 === missing.length) {
        console.debug(`No missing roles in [${roles.join("], [")}].`);
        return (<>{children}</>);
    }
    return (<h1>Access Denied</h1>);
}
