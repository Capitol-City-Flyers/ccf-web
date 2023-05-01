import {createContext, useContext} from "react";
import {FlightLocation} from "../types/FlightsTypes";
import {TailNumber} from "../data";

/**
 * Contents of the {@link FlightsContext} context. Contains {@link FlightLocation} entries for in-flight aircraft
 * *only*.
 */
export type FlightsContextContents = {
    [tailNumber in TailNumber]: FlightLocation
};

/**
 * Context from which the current aircraft flight status can be obtained via the {@link useFlights} hook.
 */
export const FlightsContext = createContext<null | FlightsContextContents>(null);

/**
 * Retrieve the current aircraft flight status.
 */
export function useFlights() {
    const contents = useContext(FlightsContext);
    if (null == contents) {
        throw Error("Context is empty.");
    }
    return contents;
}
