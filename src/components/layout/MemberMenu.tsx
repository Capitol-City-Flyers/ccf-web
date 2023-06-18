import {useCallback} from "react";
import {useAppDispatch, usePrefs} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import PageLink from "./PageLink";

export default function MemberMenu() {
    const dispatch = useAppDispatch(),
        {device: {enableExperimentalFeatures}} = usePrefs(),
        messages = useMessages({
            experiments: "cin.title.experiments",
            logout: "cin.action.logout",
            preferences: "cin.title.preferences",
            profile: "cin.title.profile"
        });
    const onLogoutClick = useCallback(() => {
        dispatch({kind: "authLoggedOut"});
    }, [dispatch]);
    return (
        <ul className="menu p-0 w-64">
            <li><PageLink className="select-none rounded-b-none rounded-tl-box rounded-tr-none" href="/members">{messages.profile}</PageLink></li>
            <li><PageLink className="select-none rounded-none" href="/members/preferences">{messages.preferences}</PageLink></li>
            {enableExperimentalFeatures && (
                <li><PageLink className="select-none rounded-none" href="/members/experiments">{messages.experiments}</PageLink></li>
            )}
            <li><a className="select-none rounded-b-box rounded-t-none" onClick={onLogoutClick}>{messages.logout}</a></li>
        </ul>
    );
}
