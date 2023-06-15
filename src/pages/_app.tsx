import {useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {useRouter} from "next/router";
import AppHead from "../components/app/AppHead";
import Layout from "../components/layout/Layout";
import loadConfig from "../config";
import AppProvider from "../providers/app/AppProvider";
import type {Config, Environment} from "../config-types";
import type {ProviderComponentProps} from "../providers/app/app-types";

import "../../styles/globals.css";

/**
 * [App] handles basic bootstrapping of the application, including determination of the environment (build vs.
 * in-browser) and assembling the lists of base services and available plugins.
 *
 * @param Component the page component.
 * @param pageProps the page properties.
 * @constructor
 */
export default function App({Component, pageProps}) {
    const {basePath} = useRouter(),
        build = "undefined" === typeof window,
        env: Environment = build ? "_build" : new URL(basePath || "/", new URL(window.document.baseURI)),
        config = useMemo<Config>(() => freeze(_.cloneDeep(loadConfig(env)), true), []);

    /* Coalesce all provider components and bind them to standard properties. */
    const Providers = useMemo(() => {
        const props = freeze<ProviderComponentProps>({config, env}),
            appProvider = ({children}) => (<AppProvider {...props}>{children}</AppProvider>);
        return config.providers.reduce((Providers, Provider) =>
            ({children}) => (
                <Providers>
                    <Provider {...props}>{children}</Provider>
                </Providers>
            ), appProvider);
    }, []);
    return (
        <Providers>
            <AppHead/>
            <Layout>
                <Component {...pageProps}/>
            </Layout>
        </Providers>
    );
}
