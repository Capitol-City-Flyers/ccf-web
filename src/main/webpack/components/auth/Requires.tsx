import React, {ComponentType, PropsWithChildren, ReactNode} from "react";
import {AircraftClubsRequires} from "./aircraftclubs/AircraftClubsRequires";
import {Role} from "../../state/AppState";

/**
 * Properties for a {@link Requires} component.
 */
export type RequiresProps = Partial<{[role in Role]: true}> & {
    denied?: ReactNode | ComponentType<DeniedComponentProps>;
};

/**
 * Properties passed to any component identified as a {@link RequiresProps.denied}.
 */
export interface DeniedComponentProps {
    missingRoles: Array<Role>;
}

/**
 * {@link Requires} expresses zero or more roles which are required to view a branch of child content. Child content is
 * rendered only if the user has *all* of the specified roles.
 *
 * @param children the child elements.
 * @param props the component properties.
 * @constructor
 */
export function Requires({children, ...props}: PropsWithChildren<RequiresProps>) {
    return (
        <AircraftClubsRequires {...props}>
            {children}
        </AircraftClubsRequires>
    );
}
