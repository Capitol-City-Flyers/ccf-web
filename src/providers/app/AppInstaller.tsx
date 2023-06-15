import {useApp} from "./AppContext";
import {useEffect, useState} from "react";

/**
 * {@link AppInstaller} handles installation and uninstallation of the Workbox service worker per device preferences.
 *
 * @constructor
 */
export default function AppInstaller() {
    const {dispatch, env, state: {prefs: {device: {install}}}} = useApp(),
        build = "_build" === env,
        [workerState, setWorkerState] = useState<WorkerState>(build ? "notInstalled" : "undetermined");

    /* Handle worker state and installation preference changes. */
    useEffect(() => {
        if (!build) {

            /* Check for presence of workbox-window; if it does not exist, the service worker has been disabled in the
            next-pwa config, such as during local development. */
            if (!("workbox" in window)) {
                if (install) {
                    console.debug("The 'install' preference is set but workbox-window is not present (in development?) The service worker will not be installed.");
                }
                setWorkerState("notInstalled");
            } else {
                const {navigator: {serviceWorker}} = window,
                    workerURL = new URL("./sw.js", env);
                if ("undetermined" === workerState) {
                    serviceWorker.getRegistration(workerURL)
                        .then(registration => setWorkerState(null == registration ? "notInstalled" : "installed"));
                } else if (install !== (workerState === "installed" || workerState === "installationFailed")) {
                    if (install) {
                        serviceWorker.register(workerURL, {
                            scope: env.pathname
                        }).then(registration => {
                            if (null == registration) {
                                setWorkerState("installationFailed");
                                console.warn("Attempt to install service worker failed.");
                            } else {
                                setWorkerState("installed");
                                console.debug("Installed service worker.");
                            }
                        });
                    } else {
                        serviceWorker.getRegistration(workerURL)
                            .then(registration => {
                                if (null == registration) {
                                    setWorkerState("notInstalled");
                                    console.debug("Service worker not installed.");
                                } else {
                                    registration.unregister().then(uninstalled => {
                                        if (!uninstalled) {
                                            console.warn("Attempt to uninstall service worker failed.");
                                        } else {
                                            setWorkerState("notInstalled");
                                            console.debug("Uninstalled service worker.");
                                        }
                                    });
                                }
                            });
                    }
                }
            }
        }
    }, [install, workerState]);

    /* Update app state when installation status changes. */
    useEffect(() => {
        dispatch({
            kind: "workerStatusChanged",
            payload: "installed" === workerState ? "installed" : "notInstalled"
        });
    }, [workerState]);
    return null;
}

type WorkerState =
    | "installationFailed"
    | "installed"
    | "notInstalled"
    | "undetermined";
