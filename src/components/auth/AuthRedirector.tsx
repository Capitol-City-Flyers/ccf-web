import {useApp, useAppState, useRoles} from "../../providers/app/AppContext";
import {useRouter} from "next/router";
import {useEffect, useRef} from "react";

/**
 * {@link AuthRedirector} updates the current route as necessary when certain authentication state changes occur.
 * * Routes the user to `/` after logout.
 *
 * @constructor
 */
export default function AuthRedirector() {
    const {member} = useRoles(),
        {status: {client: {ready}}} = useAppState(),
        router = useRouter(),
        memberRef = useRef(!!member);
    useEffect(() => {
        if (ready && memberRef.current !== member) {
            memberRef.current = member;
            if (!member) {
                router.replace("/").then();
            }
        }
    }, [member, ready]);
    return null;
}
