import React, {useMemo} from "react";
import {PanelButton} from "./PanelButton";
import MemberMenu from "./MemberMenu";
import {useRoles} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import {useAppState} from "../../providers/app/AppContext";
import AircraftClubsLoginPanel from "../../integrations/aircraftclubs/AircraftClubsLoginPanel";

/**
 * {@link ProfileButton} displays either a login button or a profile button depending upon whether the user is currently
 * logged in as a member.
 *
 * @constructor
 */
export function ProfileButton() {
    const roles = useRoles({loggedIn: "authenticated"});
    return roles.loggedIn ? (<MemberButton/>) : (<LoginButton/>);
}

/**
 * {@link LoginButton} displays the login component for the configured authentication handler.
 *
 * @constructor
 */
function LoginButton() {
    const messages = useMessages({
        member: "cin.title.member"
    });
    return (
        <PanelButton label={messages.member}>
            <AircraftClubsLoginPanel/>
        </PanelButton>
    );
}

/**
 * Button displayed if the user is a *member*.
 *
 * @constructor
 */
function MemberButton() {
    const {auth: {credentials}, prefs: {identity}} = useAppState(),
        messages = useMessages(!identity ? {
            member: "cin.title.member"
        } : {
            displayName: {
                message: "cin.format.identity.display-name",
                params: [
                    identity.givenName,
                    identity.familyName?.substring(0, 1)
                ]
            }
        }),
        displayName = useMemo(() => {
            if ("member" in messages) {
                return messages.member;
            }
            const displayName = messages.displayName.trim();
            if (displayName) {
                return displayName;
            }
            return credentials.username.trim();
        }, [messages]);
    return (
        <PanelButton label={displayName}>
            <MemberMenu/>
        </PanelButton>
    );
}
