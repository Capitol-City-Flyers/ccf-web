import React, {useCallback} from "react";
import {useAppDispatch} from "../../context/AppContext";

export function MemberMenu() {
    const dispatch = useAppDispatch();
    const onClickLogout = useCallback(() => {
        dispatch({
            kind: "user logged out"
        });
    }, [dispatch]);
    return (
        <ul className="menu menu-compact w-64">
            <li><a className="rounded-tl-box hover:bg-blue-100">Profile</a></li>
            <li><a className="hover:bg-blue-100">Status</a></li>
            <li><a className="rounded-b-box hover:bg-blue-100" onClick={onClickLogout}>Log Out</a></li>
        </ul>
    );
}
