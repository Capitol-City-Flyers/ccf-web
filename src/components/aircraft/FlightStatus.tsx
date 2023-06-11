import {useFlight} from "../../providers/flights/FlightsContext";
import type {ElementType} from "react";
import type {AircraftIdent} from "../../aircraft/aircraft-types";
import type {GeoPosition} from "../../navigation/navigation-types";

/**
 * Properties for a component that renders flight status from a {@link FlightStatus} component.
 */
export interface FlightStatusComponentProps {
    aircraft: AircraftIdent;
    position: GeoPosition;
    place?: string;
}

/**
 * Properties for a {@link FlightStatus} component.
 */
interface FlightStatusProps {
    aircraft: AircraftIdent;
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
        flight = useFlight(aircraft);
    if (null == flight) {
        return null;
    }
    const {component: Component} = props;
    return (<Component aircraft={aircraft} {...flight}/>);
}
