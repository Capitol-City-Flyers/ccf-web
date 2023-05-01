import React from "react";
import {Dictionary} from "lodash";
import {AppServices} from "./components/app/AppServices";
import {Router} from "./pages/Router";
import {AppConfig} from "./types/AppTypes";

interface CcfAppProps {
    config: AppConfig;
    messagesByLocale: Dictionary<Dictionary<string>>;
    window: Window;
}

export function CcfApp({config, messagesByLocale, window}: CcfAppProps) {
    return (
        <AppServices config={config} messagesByLocale={messagesByLocale} window={window}>
            <Router config={config}/>
        </AppServices>
    );
}
