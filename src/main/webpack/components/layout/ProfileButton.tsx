import React from "react";
import {useAuth, useSecurity} from "../../context/AppContext";
import {AircraftClubsLoginPanel} from "../auth/aircraftclubs/AircraftClubsLoginPanel";
import {PanelButton} from "./PanelButton";
import {MemberMenu} from "./MemberMenu";

/**
 * {@link ProfileButton} displays either a login button or a profile button depending upon whether the user is currently
 * logged in as a member.
 *
 * @constructor
 */
export function ProfileButton() {
    const {visitor} = useSecurity();
    return (visitor ? <LoginButton/> : <MemberButton/>);
}

/**
 * Button displayed if the user is a *visitor.*
 *
 * @constructor
 */
function LoginButton() {
    return (<PanelButton label="Members" panel={AircraftClubsLoginPanel}/>);
}

/**
 * Button displayed if the user is a *member*.
 *
 * @constructor
 */
function MemberButton() {
    const {identity} = useAuth();
    return (<PanelButton label={identity!.displayName} panel={MemberMenu}/>);
}
