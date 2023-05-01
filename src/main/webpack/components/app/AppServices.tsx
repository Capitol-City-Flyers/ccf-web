import React from "react";
import {PropsWithChildren} from "react";
import {AppProvider} from "./AppProvider";
import {AuthProvider} from "../auth/AuthProvider";
import {AppConfig} from "../../types/AppTypes";
import {ClubDataSourceProvider} from "./ClubDataSourceProvider";
import {Dictionary} from "lodash";

/**
 * Properties for an {@link AppServices} component.
 */
interface AppServicesProps {
    config: AppConfig;
    messagesByLocale: Dictionary<Dictionary<string>>;
    window: Window;
}

/**
 * {@link AppServices} bootstraps services which are available for all pages in the application.
 *
 * @constructor
 */
export function AppServices({children, config, messagesByLocale, window}: PropsWithChildren<AppServicesProps>) {
    const {document} = window;
    return (
        <AppProvider config={config} messagesByLocale={messagesByLocale} window={window}>
            <AuthProvider document={document}>
                <ClubDataSourceProvider config={config}>
                    {children}
                </ClubDataSourceProvider>
            </AuthProvider>
        </AppProvider>
    );
}
