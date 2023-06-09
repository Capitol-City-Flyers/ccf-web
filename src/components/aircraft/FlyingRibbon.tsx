import {PropsWithChildren} from "react";
import {FlightStatusComponentProps} from "./FlightStatus";
import {useMessages} from "../../providers/messages/MessagesContext";

/**
 * {@link FlyingRibbon} displays a ribbon in the top-right corner of an aircraft gallery item if an aircraft is in
 * flight.
 *
 * @param props
 * @constructor
 */
export default function FlyingRibbon(props: PropsWithChildren<FlightStatusComponentProps>) {
    const {aircraft, place} = props,
        messages = useMessages({
            inFlight: "cin.label.flying-ribbon.in-flight",
            near: "cin.label.flying-ribbon.near"
        });
    return (
        <div className="ribbon opacity-90 text-xs">
            <div className="font-bold text-center">{messages.inFlight}</div>
            {place && (
                <div>
                    {messages.near} <a href={`https://flightaware.com/live/flight/${aircraft.tailNumber}`}
                                       target="_blank">{place}</a>
                </div>
            )}
        </div>
    );
}
