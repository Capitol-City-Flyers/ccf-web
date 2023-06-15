import {useCallback} from "react";
import {useAppDispatch} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import Link from "next/link";

export default function MemberMenu() {
    const dispatch = useAppDispatch(),
        messages = useMessages({
            logout: "cin.action.logout",
            preferences: "cin.title.preferences",
            profile: "cin.title.profile"
        });
    const onLogoutClick = useCallback(() => {
        dispatch({kind: "authLoggedOut"});
    }, [dispatch]);
    return (
        <ul className="menu p-0 w-64">
            <li><Link className="select-none rounded-b-none rounded-tl-box rounded-tr-none" href="/members">{messages.profile}</Link></li>
            <li><Link className="select-none rounded-none" href="/members/preferences">{messages.preferences}</Link></li>
            <li><a className="select-none rounded-b-box rounded-t-none" onClick={onLogoutClick}>{messages.logout}</a></li>
        </ul>
    );
}
