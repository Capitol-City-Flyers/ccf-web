import Require from "../../components/auth/Require";
import Link from "next/link";
import {useMemo} from "react";
import {freeze} from "immer";
import {OidcProvider, OidcSecure} from "@axa-fr/react-oidc";

export default function() {
    const oidcConfig = useMemo(() => ({
        authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_Ss8A44JD9",
        client_id: "3l9b48v7p4ef1dj33iso600mf5",
        redirect_uri: "http://localhost:3000/members",
        refresh_time_before_tokens_expiration_in_second: 3600,
        scope: "email openid phone profile"
    }), []);
    return (
        <OidcProvider configuration={oidcConfig}>
            <OidcSecure>
                <h1 className="text-3xl font-bold underline">Profile</h1>
                <div>
                    <h2>Links</h2>
                    <Link href="/">Home</Link>
                </div>
            </OidcSecure>
        </OidcProvider>
    );
}
