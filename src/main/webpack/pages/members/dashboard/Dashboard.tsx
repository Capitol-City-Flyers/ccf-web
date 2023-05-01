import React from "react";
import {MyFlights} from "./MyFlights";
import {AvailabilityWidget} from "./availability/AvailabilityWidget";

export function Dashboard() {
    return (
        <section className="flex flex-wrap space-x-4">
            <MyFlights/>
            <AvailabilityWidget/>
        </section>
    );
}
