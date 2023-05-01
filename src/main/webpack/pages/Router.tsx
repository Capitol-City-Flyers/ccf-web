import React, {useMemo} from "react";
import {AppConfig} from "../types/AppTypes";
import {BrowserRouter, HashRouter, Route, Routes} from "react-router-dom";
import Index from "./Index";
import Membership from "./Membership";
import {useConfig} from "../context/AppContext";
import {Dashboard} from "./members/dashboard/Dashboard";
import {PageLayout} from "../components/layout/PageLayout";

/**
 * Properties for a {@link Router} component.
 */
interface RouterProps {
    config: AppConfig;
}

/**
 * {@link Router} is the client-side router.
 *
 * @param baseUrl the app base URL.
 * @constructor
 */
export function Router({config: {baseUrl}}: RouterProps) {
    const baseName = useMemo(() => baseUrl.pathname.replace(/\/+$/, ""), [baseUrl]),
        {standalone} = useConfig();

    /* Use HashRouter to prevent navigation events from changing the location bar and breaking out of full screen mode
    when installed on a device; use BrowserRouter everywhere else to facilitate deep linking with friendly URLs. */
    const RouterComponent = useMemo(() => standalone ? HashRouter : BrowserRouter, [standalone]);
    return (
        <RouterComponent basename={baseName}>
            <Routes>
                <Route path="/" element={<PageLayout/>}>
                    <Route index element={<Index/>}/>
                    <Route path="membership" element={<Membership/>}/>
                    <Route path="members">
                        <Route index element={<Dashboard/>}/>
                    </Route>
                </Route>
            </Routes>
        </RouterComponent>
    );
}
