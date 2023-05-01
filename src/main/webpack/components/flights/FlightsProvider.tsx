import React, {PropsWithChildren, useCallback, useEffect, useMemo, useReducer} from "react";
import {freeze} from "immer";
import {FlightsContext} from "../../context/FlightsContext";
import {FlightsReducer, FlightsState} from "../../state/FlightsState";
import {NominatimClient} from "./NominatimClient";
import {OpenSkyClient} from "./OpenSkyClient";
import {Aircraft, TailNumber} from "../../data";
import {useApp} from "../../context/AppContext";

/**
 * Properties for a {@link FlightsProvider} component.
 */
interface FlightsProviderProps {

    /**
     * All aircraft in the fleet.
     */
    aircraft: Array<Aircraft>;
}

/**
 * Empty dictionary of tail numbers to Mode S codes.
 */
const emptyModeSCodesByTailNumber: { [tailNumber in TailNumber]: string } = freeze({});

/**
 * {@link FlightsProvider} sets up and maintains live flight status information for access via the {@link useFlights()}
 * hook.
 *
 * @param children the child element(s).
 * @param props the component properties.
 * @constructor
 */
export function FlightsProvider({children, ...props}: PropsWithChildren<FlightsProviderProps>) {
    const {reverseGeo, flightInfo} = useMemo(() => ({
            reverseGeo: NominatimClient.create(),
            flightInfo: OpenSkyClient.create()
        }), []),
        {aircraft} = props,
        initialState = useMemo(() => new FlightsState(aircraft, 60_000, 600_000), [JSON.stringify(props)]),
        [state, dispatch] = useReducer<FlightsReducer>(FlightsState.reduce, initialState),
        {online} = useApp(),
        {flightLocationsByTailNumber, nextUpdate} = state,
        modeSCodesByTailNumber = useMemo(() =>
            freeze(aircraft.reduce((modeSCodesByTailNumber, {tailNumber, modeSCode}) => ({
                ...modeSCodesByTailNumber,
                [tailNumber]: modeSCode
            }), emptyModeSCodesByTailNumber)), [aircraft]);

    /* Callback to update flight status for all aircraft in need of update at a given check date/time. */
    const retrieveFlightStatus = useCallback((check: Date) => {
        console.debug("Beginning a flight status check.");
        dispatch({
            kind: "status update started",
            payload: check
        });
        const tailNumbers = state.tailNumbersToUpdate(check);
        if (0 === tailNumbers.length) {
            console.debug("No tail numbers are due for flight status update.");
        } else {

            /* Push out next update date/time in case we fail, then request tracks for each tail number */
            console.debug(`Updating flight status for tail numbers: [${tailNumbers.join(", ")}].`);
            tailNumbers.forEach(tailNumber =>
                flightInfo.retrievePosition(modeSCodesByTailNumber[tailNumber]!)
                    .then(position => {
                        if (null == position) {

                            /* No position for this aircraft; if it was previously in flight, end the flight. */
                            if (tailNumber in state.flightLocationsByTailNumber) {
                                console.debug(`Flight in [${tailNumber}] has ended.`);
                                dispatch({
                                    kind: "flight ended",
                                    payload: {
                                        updated: check,
                                        tailNumber
                                    }
                                });
                            }
                            return null;
                        }

                        /* Got a position for this aircraft; resolve the nearest place name if possible. */
                        return reverseGeo.retrievePlace(position)
                            .then(place => {
                                dispatch({
                                    kind: "flight updated",
                                    payload: {
                                        location: {
                                            position,
                                            ...(null == place ? {} : {place})
                                        },
                                        updated: check,
                                        tailNumber
                                    }
                                })
                            });
                    }));
        }
    }, [modeSCodesByTailNumber, state]);

    /* Effect to periodically trigger flight status updates. */
    useEffect(() => {
        if (!online) {
            console.debug("Suspending flight status updates while offline.");
        } else  {
            const now = new Date(),
                delayMillis = nextUpdate.getTime() - now.getTime();
            if (delayMillis <= 0) {
                retrieveFlightStatus(now);
            } else {
                console.debug(`Next flight status update will occur at about [${nextUpdate.toISOString()}].`);
                const timeoutId = setTimeout(() => retrieveFlightStatus(new Date()), delayMillis);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [nextUpdate, online]);
    return (
        <FlightsContext.Provider value={flightLocationsByTailNumber}>
            {children}
        </FlightsContext.Provider>
    );
}
