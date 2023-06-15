import {PropsWithChildren, useCallback, useEffect, useMemo, useState} from "react";
import {freeze, produce} from "immer";
import _ from "lodash";
import {DateTime} from "luxon";
import {useNominatimClient} from "../../integrations/nominatim/NominatimContext";
import {useOpenSkyClient} from "../../integrations/opensky/OpenSkyContext";
import {EPOCH_UTC, nowUTC} from "../../utilities/date-utils";
import {useAppState, useConfig} from "../app/AppContext";
import {type FlightsState, type AircraftFlightStatus, isInFlight} from "./flights-types";
import {type FlightsContext, flightsContext} from "./FlightsContext";
import type {AircraftIdent} from "../../aircraft/aircraft-types";
import type {SyncConfig} from "../../config-types";

/**
 * Properties for a {@link FlightsProviderProps} component.
 */
interface FlightsProviderProps {
    aircraft: Array<AircraftIdent>;
}

/**
 * {@link FlightsProvider} provides (nearly) live tracking data for aircraft which are in flight. Flight data is exposed
 * for access via the {@link useFlights} and {@link useFlight} hooks; the hooks will return data only for those aircraft
 * which are in flight.
 *
 * @param props the component properties.
 * @constructor
 */
export default function FlightsProvider(props: PropsWithChildren<FlightsProviderProps>) {
    const {aircraft, children} = props,
        aircraftByTailNumber = _.keyBy(aircraft, "tailNumber"),
        {status: {client: {online, visible}}} = useAppState(),
        {sync: {flights: config}} = useConfig(),
        openSky = useOpenSkyClient(),
        nominatim = useNominatimClient(),
        initialState = useMemo<FlightsState>(() => freeze({
            flights: _.map(aircraft, ({tailNumber}) => ({
                status: "undetermined",
                updated: EPOCH_UTC,
                tailNumber
            })),
            aircraftByTailNumber
        }, true), []),
        [state, updateState] = useState<FlightsState>(initialState),
        context = useMemo<FlightsContext>(() => freeze({state}), [state]);

    /* Callback to request flight position and reverse geo updates when necessary. */
    const {flights} = state;
    const updateFlights = useCallback((cutoff: DateTime) => {
        const updateNeeded = flights.filter(flight => needsUpdate(flight, config, cutoff))
            .map(({tailNumber}) => aircraftByTailNumber[tailNumber]);
        if (_.isEmpty(updateNeeded)) {
            console.debug("No aircraft are due for position update.");
        } else {

            /* Request position updates from OpenSky; update state accordingly. */
            console.debug(`Updating positions for ${updateNeeded.length} aircraft.`);
            openSky.queryPositions(updateNeeded)
                .then(async positions => {

                    /* Update position and/or status of each flight. */
                    const positionByTailNumber = _.keyBy(positions, "aircraft.tailNumber");
                    updateState(previous => produce(previous, draft => {
                        for (const flight of draft.flights) {
                            const {tailNumber} = flight;
                            if (!positionByTailNumber.hasOwnProperty(tailNumber)) {
                                console.debug(`Aircraft [${tailNumber}] is not in flight.`);
                                flight.status = "notInFlight";
                            } else {
                                const {position} = positionByTailNumber[tailNumber];
                                console.debug(`Aircraft [${tailNumber}] is in flight.`, position);
                                flight.status = {
                                    kind: "inFlight",
                                    position
                                };
                            }
                            flight.updated = cutoff;
                        }
                    }));

                    /* Request reverse geo of in flight aircraft from Nominatim; update state accordingly. */
                    for (const {aircraft, position} of positions) {
                        const place = await nominatim.retrievePlace(position);
                        if (null == place) {
                            console.debug("Place name was not found.", position);
                        }
                        if (null != place) {
                            console.debug(`Place name [${place}] was found.`, position);
                            updateState(previous => produce(previous, draft => {
                                const flight = draft.flights.find(({tailNumber}) => tailNumber === aircraft.tailNumber);
                                if (isInFlight(flight.status)) {
                                    flight.status.place = place;
                                }
                            }));
                        }
                    }
                });
        }
    }, [config, flights, openSky, nominatim, updateState]);

    /* Trigger status updates as needed. Note that we do not update when offline or when the browser is covered. */
    const shouldUpdate = online && visible;
    useEffect(() => {
        if (shouldUpdate) {

            /* Find aircraft whose positions are *not* yet due for update; if any *are* due, trigger update. */
            const now = nowUTC(),
                updateNotNeeded = flights.filter(flight => !needsUpdate(flight, config, now));
            if (!_.isEmpty(_.difference(flights, updateNotNeeded))) {
                updateFlights(now);
            }

            /* Determine time when next update will be due. */
            const nextUpdate = updateNotNeeded.reduce((acc, flight) => {
                    const due = calculateNextUpdate(flight, config);
                    return due < acc ? due : acc;
                }, now.plus(config.notInFlightInterval)),
                delay = nextUpdate.diff(now);

            /* Schedule a timer task to trigger next update. */
            console.debug(`Scheduling next update in ${delay.rescale().toHuman()}.`);
            const timeout = setTimeout(() => updateFlights(nowUTC()), delay.toMillis());
            return () => clearTimeout(timeout);
        }
    }, [config, flights, shouldUpdate]);
    return (
        <flightsContext.Provider value={context}>
            {children}
        </flightsContext.Provider>
    );
}

/**
 * Determine the date/time at which a flight will *next* become due for a position update.
 *
 * @param flight the flight.
 * @param config the update interval configuration.
 */
function calculateNextUpdate(flight: AircraftFlightStatus, config: SyncConfig["flights"]) {
    const {status, updated} = flight;
    switch (status) {
        case "undetermined":
            return updated;
        case "notInFlight":
            return updated.plus(config.notInFlightInterval);
        default:
            return updated.plus(config.inFlightInterval);
    }
}

/**
 * Determine whether a flight is due for a position update as of a given `cutoff` date/time.
 *
 * @param flight the flight.
 * @param config the update interval configuration.
 * @param cutoff the cutoff date/time.
 */
function needsUpdate(flight: AircraftFlightStatus, config: SyncConfig["flights"], cutoff: DateTime) {
    return cutoff >= calculateNextUpdate(flight, config);
}
