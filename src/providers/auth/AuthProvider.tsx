import {PropsWithChildren, useCallback, useMemo} from "react";
import {OidcConfiguration, OidcProvider} from "@axa-fr/react-oidc";
import {useRouter} from "next/router";
import OidcAuthHandler from "./OidcAuthHandler";
import {ProviderComponentProps} from "../app/app-types";
import {freeze} from "immer";

export default function AuthProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config: {auth: {oidc}}, env} = props,
        router = useRouter(),
        build = "_build" === env,
        oidcConfig = useMemo<OidcConfiguration>(() => ({
            authority: oidc.authority.href,
            client_id: oidc.clientId,
            redirect_uri: build ? "/oidc/callback" : new URL("/oidc/callback", env).href,
            scope: oidc.scopes.join(" ")
        }), []);

    /* OIDC callback handler. */
    const withCustomHistory = useCallback(() => freeze({
        replaceState(url: string) {
            router.replace({
                pathname: url
            }).then(() => {
                window.dispatchEvent(new Event("popstate"));
            });
        }
    }), []);
    return (
        <OidcProvider configuration={oidcConfig}
                      withCustomHistory={withCustomHistory}>
            <OidcAuthHandler/>
            {children}
        </OidcProvider>
    );
}
