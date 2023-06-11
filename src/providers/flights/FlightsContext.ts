import {createContext, useContext, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {type Flight, type FlightsState, type InFlight, isInFlight} from "./flights-types";
import type {AircraftIdent, TailNumber} from "../../aircraft/aircraft-types";

/**
 * Context holding information on aircraft which are currently in flight.
 */
export interface FlightsContext {
    state: FlightsState;
}

/**
 * Context in which the {@link FlightsContext} is held for access by related hooks.
 */
export const flightsContext = createContext<FlightsContext | null>(null);

/**
 * Hook to retrieve the status of all active flights.
 */
export function useFlights() {
    const context = useContext(flightsContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    const {state: {aircraftByTailNumber, flights}} = context;
    return useMemo<Array<Flight>>(() => {
        const inFlight = flights.filter(({status}) => isInFlight(status));
        return freeze(inFlight.map(flight => ({
            aircraft: aircraftByTailNumber[flight.tailNumber],
            ..._.pick(flight.status as InFlight, ["place", "position"])
        })), true);
    }, [flights]);
}

/**
 * Hook to retrieve the status of the active flight in a given aircraft, if any.
 *
 * @param aircraft the aircraft or tail number.
 */
export function useFlight(aircraft: AircraftIdent | TailNumber): Flight | null {
    const tailNumber = _.isString(aircraft) ? aircraft : aircraft.tailNumber,
        flights = useFlights();
    return useMemo(() => flights.find(({aircraft}) => aircraft.tailNumber === tailNumber) || null, [flights]);
}
