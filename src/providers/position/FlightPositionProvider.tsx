import {PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState} from "react";
import _ from "lodash";
import {AircraftConfig} from "../../config-types";
import {useAppState, useConfig} from "../app/AppContext";
import {DateTime, DurationLike} from "luxon";
import {EPOCH_UTC, nowUTC} from "../../utilities/date-utils";
import {TailNumber} from "../../aircraft/aircraft-types";
import {GeoPosition} from "../../navigation/navigation-types";
import {freeze, produce} from "immer";
import {useOpenSkyClient} from "../../integrations/opensky/OpenSkyContext";
import {useNominatimClient} from "../../integrations/nominatim/NominatimContext";
import {FlightPositionState} from "./FlightPositionState";

interface FlightTrackingProviderProps {
    aircraft: Array<AircraftConfig>;
}

export default function FlightPositionProvider(props: PropsWithChildren<FlightTrackingProviderProps>) {
    const {aircraft} = props,
        {status: {online, visible}} = useAppState(),
        {sync: {flightStatus: {interval, inFlightInterval}}} = useConfig(),
        openSky = useOpenSkyClient(),
        nominatim = useNominatimClient(),
        initialState = useMemo<FlightPositionState>(() => FlightPositionState.create(aircraft), []),
        [state, updateState] = useReducer(FlightPositionState.reduce, initialState);

    const updateTrackingStatus = useCallback(() => {

    }, []);

    /* Request updates when necessary. */
    const shouldUpdate = online && visible,
        {tracking} = state;
    useEffect(() => {
        if (shouldUpdate) {

            /* Determine date/time at which each tracking status is due for update. */
            const updateDue = _.map(tracking, (track) => {
                const {status, updated} = track;
                let due: DateTime;
                if ("undetermined" === status) {
                    due = updated;
                } else if ("notTracking" === status) {
                    due = updated.plus(interval);
                } else {
                    due = updated.plus(inFlightInterval);
                }
                return [due, track] as const;
            });

            /* Collect tracking statuses due for update; determine time of next update check. */
            const now = nowUTC(),
                needUpdate = new Array<FlightPositionState["tracking"][number]>();
            let nextCheck: DateTime;
            for (const [due, track] of updateDue) {
                if (due <= now) {
                    needUpdate.push(track);
                } else if (null == nextCheck || due < nextCheck) {
                    nextCheck = due;
                }
            }


        }
    }, [shouldUpdate, tracking]);

}
