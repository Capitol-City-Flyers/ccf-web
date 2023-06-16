import React from "react";
import {useMessages} from "../../providers/messages/MessagesContext";
import ActionButton from "./ActionButton";
import Link from "next/link";

/**
 * {@link ProfileButton} displays either a login button or a profile button depending upon whether the user is currently
 * logged in as a member.
 *
 * @constructor
 */
export function ProfileButton() {
    const messages = useMessages({
        members: "cin.title.members"
    });
    return (
        <div>
            <Link className="border-blue-100 bg-blue-400 drop-shadow-md inline-block px-3 py-1 rounded-box text-white hover:bg-blue-500"
                  href="/members">{messages.members}</Link>
        </div>
    );
}
