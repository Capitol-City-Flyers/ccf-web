import React, {ComponentType, PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {useAuth} from "../../../context/AppContext";
import {ROLES} from "../../../state/AppState";
import {DeniedComponentProps, RequiresProps} from "../Requires";

export function AircraftClubsRequires({children, ...props}: PropsWithChildren<RequiresProps>) {
    const {roles: hasRoles} = useAuth(),
        missingRoles = useMemo(() => {
            const needsRoles = ROLES.filter(role => role in props);
            return freeze([...needsRoles].filter(role => -1 === hasRoles.indexOf(role)));
        }, [hasRoles, props]);

    /* Determine whether access should be denied. */
    let denied: boolean;
    if (0 === missingRoles.length) {
        denied = false;
    } else if (missingRoles.length > 1) {
        denied = true;
    } else {
        denied = -1 === missingRoles.indexOf("visitor");
    }

    /* Display the appropriate view (or nothing.) */
    if (denied) {
        const {denied: deniedView} = props;
        if (null == deniedView) {
            return null;
        } else if (!_.isFunction(deniedView)) {
            return (<>{deniedView}</>);
        }
        const Denied = deniedView as ComponentType<DeniedComponentProps>;
        return (<Denied missingRoles={missingRoles}/>);
    }
    return (<>{children}</>);
}
