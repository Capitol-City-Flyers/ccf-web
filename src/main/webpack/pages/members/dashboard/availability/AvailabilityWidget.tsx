import React, {useCallback, useEffect, useMemo, useReducer} from "react";
import {useAuth, useLocalDateTime} from "../../../../context/AppContext";
import {AvailabilityReducer, AvailabilityState} from "./AvailabilityState";
import {DateWindowChangeHandler, DateWindowSelector} from "../../../../components/date/DateWindowSelector";
import {ClubDataSource} from "../../../../integrations/IntegrationTypes";
import {Interval} from "luxon";
import _ from "lodash";
import {useClubData} from "../../../../context/ClubDataContext";
import {AvailabilityGrid} from "./AvailabilityGrid";

/**
 * Dashboard widget which displays availability of the user's selected aircraft within a chosen time window.
 *
 * @constructor
 */
export function AvailabilityWidget() {
    const {dateCalc} = useLocalDateTime(),
        source = useClubData(),
        {identity} = useAuth(),
        reference = dateCalc.now().startOf("day"),
        initialState = useMemo(() =>
                AvailabilityState.initial(dateCalc, "current day", reference),
            [reference.toMillis()]),
        [state, dispatch] = useReducer<AvailabilityReducer>(AvailabilityState.reduce, initialState);

    /* Handle change of the selected date window. */
    const onWindowChange = useCallback<DateWindowChangeHandler>((window, interval) => {
        dispatch({
            kind: "window changed",
            payload: {window, interval}
        });
    }, [dispatch]);

    /* (Re)load availability when the date interval changes. */
    const {interval} = state,
        {userId} = identity!;
    useEffect(() => {
        dispatch({
            kind: "load started"
        });
        loadAvailability(source, userId!, interval)
            .then(({aircraft, reservations}) => {
                dispatch({
                    kind: "load completed",
                    payload: {aircraft, interval, reservations}
                });
            })
            .catch(ex => {
                dispatch({
                    kind: "load failed",
                    payload: ex
                });
            });
    }, [interval.start!.toMillis(), interval.end!.toMillis(), userId]);

    /* Component body. */
    const {availability, error, loading, window} = state;
    return (
        <section className="w-96">
            <h1 className="bg-blue-50 font-medium px-4 py-1 rounded-t-xl">Aircraft Availability</h1>
            <article className="bg-white border-x-2 border-b-2 drop-shadow-sm p-4">
                <DateWindowSelector includeCustom={false}
                                    include={["current day", "next day"]}
                                    value={window}
                                    onChange={onWindowChange}/>
                {error ? <p>{JSON.stringify(error)}</p>
                    : loading ? <p>Loading</p>
                        : <AvailabilityGrid availability={availability} interval={interval}/>}
            </article>
        </section>
    );
}

/**
 * Load availability data for the user's selected aircraft.
 *
 * @param source the data source.
 * @param userId the user identifier.
 * @param interval the interval for which to get availability data.
 */
async function loadAvailability(source: ClubDataSource, userId: string, interval: Interval) {
    const user = await source.getMemberDetails(parseInt(userId)),
        aircraftIds = user.aircraft.filter(({selected}) => true || selected).map(({id}) => id);
    return {
        reservations: _.flatten(await Promise.all(aircraftIds.map(id => source.getAircraftReservations(id, interval)))),
        aircraft: await Promise.all(aircraftIds.map(id => source.getAircraft(id)))
    };
}
