import React, {useEffect, useState} from "react";
import {useClubData} from "../../../context/ClubDataContext";
import {useAuth} from "../../../context/AppContext";
import {
    ClubAircraft,
    ClubDataSource,
    ClubReservation
} from "../../../integrations/IntegrationTypes";
import {freeze, immerable} from "immer";
import _ from "lodash";
import {DateTimeLabel} from "../../../components/label/DateTimeLabel";

export function MyFlights() {
    const {identity} = useAuth(),
        data = useClubData(),
        [flights, setFlights] =
            useState<Array<UpcomingFlight>>([]);
    useEffect(() => {
        if (null == identity) {
            setFlights([]);
        } else {
            const {userId} = identity;
            retrieveUpcomingFlights(data, parseInt(userId, 10)).then(setFlights);
        }
    }, [identity]);
    return (
        <section>
            <h1 className="bg-blue-50 font-medium px-4 py-1 rounded-t-xl">My Flights</h1>
            <article className="bg-white border-x-2 border-b-2 drop-shadow-sm p-4">
                {_.isEmpty(flights)
                    ? "You have no upcoming flights."
                    : <>
                        {flights.map(flight => (
                            <div className="space-x-2"
                                 key={`reservation_${flight.reservation.id}`}>
                                &bull; <DateTimeLabel capitalize relative value={flight.reservation.time.start!.toJSDate()}/> in <a href="#">{flight.aircraft.tailNumber}: <DateTimeLabel value={flight.reservation.time.start!.toJSDate()} /></a> (<DateTimeLabel relative difference value={flight.reservation.time.end!.toJSDate()} from={flight.reservation.time.start!.toJSDate()}/>.)
                            </div>
                        ))}
                    </>
                }
            </article>
        </section>
    );
}

async function retrieveUpcomingFlights(source: ClubDataSource, memberId: number): Promise<Array<UpcomingFlight>> {
    const reservations = await source.getMemberFutureReservations(memberId),
        aircraft = await Promise.all(_.uniq(_.map(reservations, "aircraftId")).map(aircraftId => source.getAircraft(aircraftId))),
        aircraftById = _.keyBy(aircraft, "id");
    return freeze(reservations.map(reservation => new UpcomingFlight(reservation, aircraftById[reservation.aircraftId])));
}

class UpcomingFlight {
    [immerable] = true;

    constructor(public reservation: ClubReservation, public aircraft: ClubAircraft) {
    }
}