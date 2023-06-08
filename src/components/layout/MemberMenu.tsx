import {useCallback} from "react";
import {useAppDispatch} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import Link from "next/link";

export default function MemberMenu() {
    const dispatch = useAppDispatch(),
        messages = useMessages({
            logout: "cin.action.logout",
            preferences: "cin.title.preferences"
        });
    const onLogoutClick = useCallback(() => {
        dispatch({kind: "authLoggedOut"});
    }, [dispatch]);
    return (
        <ul className="menu menu-compact w-64">
            <li><Link className="rounded-tl-box hover:bg-blue-100" href="/members/preferences">{messages.preferences}</Link></li>
            <li><a className="rounded-b-box hover:bg-blue-100" onClick={onLogoutClick}>{messages.logout}</a></li>
        </ul>
    );
}
