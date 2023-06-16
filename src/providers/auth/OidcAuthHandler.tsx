import {OidcUserStatus, useOidcUser} from "@axa-fr/react-oidc";
import {useEffect} from "react";
import {useAppDispatch} from "../app/AppContext";
import {ROLES} from "../app/app-types";

export default function OidcAuthHandler() {
    const {oidcUser: user, oidcUserLoadingState: oidcState} = useOidcUser(),
        dispatch = useAppDispatch();
    useEffect(() => {
        if (OidcUserStatus.Unauthenticated === oidcState) {
            dispatch({kind: "authLoggedOut"});
        } else if (OidcUserStatus.Loaded === oidcState) {
            dispatch({
                kind: "authChanged",
                payload: {
                    roles: [...ROLES],
                    credentials: {
                        password: "todo",
                        username: user.preferred_username
                    }
                }
            });
        }
    }, [oidcState]);
    return null;
}
