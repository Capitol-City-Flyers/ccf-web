import {useCallback, useEffect} from "react";
import _ from "lodash";
import {scale} from "../../utilities/math-utils";
import {useApp} from "../app/AppContext";

/**
 * {@link GeolocationProvider} updates application state on position change *if* {@link DevicePrefs.enableGeolocation}
 * is `true`.
 *
 * @constructor
 */
export default function GeolocationProvider() {
    const {dispatch, env, state: {prefs: {device: {enableGeolocation}}}} = useApp(),
        build = "_build" === env;

    /* Position event handlers. */
    const onPositionChanged = useCallback((position: GeolocationPosition) => {
        dispatch({
            kind: "positionStatusChanged",
            payload: _.mapValues(_.pick(position.coords, ["altitude", "latitude", "longitude"]),
                value => scale(value, 4))
        });
    }, [dispatch]);
    const onPositionError = useCallback(error => {
        console.error("Disabling geolocation because an error occurred.", error);
        dispatch({
            kind: "devicePrefsChanged",
            payload: {
                enableGeolocation: false
            }
        });
    }, [dispatch]);

    /* Watch position if enabled in preferences. */
    useEffect(() => {
        if (!build && enableGeolocation) {
            const {navigator: {geolocation}} = window;
            const watch = geolocation.watchPosition(onPositionChanged, onPositionError, {
                maximumAge: 60_000
            });
            return () => {
                geolocation.clearWatch(watch);
            };
        }
    }, [enableGeolocation]);
    return null;
}
