import {ElementType, useCallback, useEffect, useState} from "react";
import {freeze} from "immer";
import {DateTime, Duration} from "luxon";
import {type AircraftConfig} from "../../config-types";
import {useOpenSkyClient} from "../../integrations/opensky/OpenSkyContext";
import {useNominatimClient} from "../../integrations/nominatim/NominatimContext";
import {type GeoPosition} from "../../navigation/navigation-types";
import {useApp} from "../../providers/app/AppContext";
import {nowUTC} from "../../utilities/date-utils";

/**
 * Properties for a component that renders flight status from a {@link FlightStatus} component.
 */
export interface FlightStatusComponentProps {
    aircraft: AircraftConfig;
    position: GeoPosition;
    place?: string;
}

/**
 * Properties for a {@link FlightStatus} component.
 */
interface FlightStatusProps {
    aircraft: AircraftConfig;
    component: ElementType<FlightStatusComponentProps>;
}

/**
 * {@link FlightStatus} periodically checks for in-flight status of an aircraft and, if found, renders the status via
 * a child component. If the aircraft is not in flight (or tracking data is not available) nothing is rendered.
 *
 * @param props the component properties.
 * @constructor
 */
export default function FlightStatus(props: FlightStatusProps) {
    const {aircraft} = props,
        {config: {sync: {flightStatus: config}}, state: {status: {online, visible}}} = useApp(),
        openSky = useOpenSkyClient(),
        nominatim = useNominatimClient(),
        [state, setState] = useState<FlightStatusState>(initialState);

    /* Asynchronously update flight status. */
    const updateFlightStatus = useCallback(() => {
        openSky.retrievePosition(aircraft.modeSCodeHex)
            .then(async position => {
                const now = nowUTC();
                if (null == position) {
                    setState({
                        dateTime: now,
                        status: "notTracking"
                    });
                } else {
                    setState({
                        dateTime: now,
                        status: {position}
                    });
                    const place = await nominatim.retrievePlace(position);
                    if (null != place) {
                        setState({
                            dateTime: now,
                            status: {position, place}
                        });
                    }
                }
            });
    }, [aircraft, config, openSky, nominatim, setState]);

    /* Trigger a flight status update when the update interval elapses *and* we are online and visible. */
    const {dateTime, status} = state,
        shouldUpdate = online && visible;
    useEffect(() => {
        if (shouldUpdate) {
            if ("undetermined" === status) {
                updateFlightStatus();
            } else {

                /* Calculate next update date/time; schedule (or trigger immediately) the next update. */
                const interval = "notTracking" === status ? config.interval : config.inFlightInterval,
                    nextUpdateDateTime = dateTime.plus(interval),
                    now = nowUTC();
                if (nextUpdateDateTime <= now) {
                    updateFlightStatus();
                } else {
                    const delayMillis = nextUpdateDateTime.diff(now).toMillis();
                    console.debug(`Scheduling next flight status update in ${Duration.fromMillis(delayMillis).rescale().toHuman()}.`)
                    const interval = setTimeout(updateFlightStatus, delayMillis);
                    return () => clearTimeout(interval);
                }
            }
        }
    }, [dateTime.toMillis(), shouldUpdate]);
    if ("undetermined" === status || "notTracking" === status) {
        return null;
    }
    const {component: Component} = props;
    return (<Component aircraft={aircraft} {...status}/>);
}

/**
 * Status when a flight is being actively tracked.
 */
interface TrackingStatus {
    position: GeoPosition;
    place?: string;
}

/**
 * Flight state for an aircraft.
 */
interface FlightStatusState {
    dateTime: DateTime;
    status:
        | "undetermined" /* Haven't checked yet. */
        | "notTracking" /* Not in flight or no tracking data available. */
        | TrackingStatus;
}

/**
 * Initial component state.
 */
const initialState = freeze<FlightStatusState>({
    dateTime: DateTime.fromMillis(0, {zone: "utc"}),
    status: "undetermined"
}, true);
