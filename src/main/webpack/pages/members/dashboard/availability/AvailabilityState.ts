import {freeze, immerable, produce} from "immer";
import {ClubAircraft, ClubReservationOverview} from "../../../../integrations/IntegrationTypes";
import {DateTime, Interval} from "luxon";
import {DateCalc, DateWindow} from "../../../../utils/DateCalc";
import _ from "lodash";
import {Reducer} from "react";

/**
 * Backing state for the Aircraft Availability dashboard.
 */
export class AvailabilityState {
    [immerable] = true;

    public availability = new Array<Availability>;
    public error: Exclude<any, undefined>;
    public loading: boolean = false;

    private constructor(public window: DateWindow, public interval: Interval) {
    }

    /**
     * Produce an initial {@link AvailabilityState}.
     *
     * @param dates the date helper.
     * @param window the selected date window.
     * @param reference the reference date/time.
     */
    static initial(dates: DateCalc, window: DateWindow, reference: DateTime) {
        if (window instanceof Interval) {
            return freeze(new AvailabilityState(window, window));
        } else {
            return freeze(new AvailabilityState(window, dates.resolve(window, reference)));
        }
    }

    /**
     * Reducer for {@link AvailabilityAction} actions.
     *
     * @param previous the previous state.
     * @param action the action.
     */
    static reduce(previous: AvailabilityState, action: AvailabilityAction) {
        console.dir(action);
        switch (action.kind) {
            case "load completed":
                return produce(previous, draft => {

                    /* Get aircraft, interval, and reservations from action; collate reservations by aircraft ID. */
                    const {payload: {aircraft, interval, reservations}} = action,
                        reservationsByAircraftId = _.groupBy(reservations, "aircraftId");

                    /* Sort aircraft by tail number; calculate available (non-reserved) intervals. */
                    draft.availability.splice(0, draft.availability.length,
                        ..._.sortBy(aircraft, ({tailNumber}) => tailNumber)
                            .map<Availability>(aircraft => {
                                const {id} = aircraft,
                                    unavailable = (reservationsByAircraftId[id] || [])
                                        .map(({time}) => time),
                                    available = interval.difference(...unavailable);
                                return {aircraft, available, interval};
                            }));
                    draft.loading = false;
                });
            case "load failed":
                return produce(previous, draft => {
                    draft.availability.splice(0, draft.availability.length);
                    draft.error = action.payload;
                    draft.loading = false;
                });
            case "load started":
                return produce(previous, draft => {
                    draft.availability.splice(0, draft.availability.length);
                    draft.error = null;
                    draft.loading = true;
                });
            case "window changed":
                return produce(previous, draft => {
                    const {payload: {interval, window}} = action;
                    draft.availability.splice(0, draft.availability.length);
                    draft.interval = interval;
                    draft.window = window;
                });
        }
    }
}

/**
 * Availability for a single aircraft.
 */
interface Availability {
    aircraft: ClubAircraft;
    available: Array<Interval>;
    interval: Interval;
}

/**
 * Availability data load completed successfully.
 */
interface LoadCompleted {
    kind: "load completed";
    payload: {
        aircraft: Array<ClubAircraft>;
        interval: Interval;
        reservations: Array<ClubReservationOverview>;
    }
}

/**
 * Availability data load failed.
 */
interface LoadFailed {
    kind: "load failed";
    payload: Exclude<any, undefined | null>;
}

/**
 * Availability data load has begun.
 */
interface LoadStarted {
    kind: "load started";
}

/**
 * Date window (interval) changed.
 */
interface WindowChanged {
    kind: "window changed";
    payload: {
        interval: Interval;
        window: DateWindow;
    }
}

/**
 * All actions which can be applied to a {@link AvailabilityState}.
 */
type AvailabilityAction =
    | LoadCompleted
    | LoadFailed
    | LoadStarted
    | WindowChanged;

/**
 * Reducer for {@link AvailabilityAction} against a {@link AvailabilityState}.
 */
export type AvailabilityReducer = Reducer<AvailabilityState, AvailabilityAction>;
