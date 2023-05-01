import {immerable, produce} from "immer";
import {Dispatch, Reducer} from "react";
import {FlightLocation} from "../types/FlightsTypes";
import {Aircraft, TailNumber} from "../data";

/**
 * {@link FlightsState} holds state relating to tracking live flight location information.
 *
 */
export class FlightsState {
    [immerable] = true;

    /**
     * Status tracking information for all aircraft, whether they are in flight or not. This is mostly housekeeping
     * information for managing update frequency and related items.
     *
     * @private
     */
    private readonly statusByTailNumber: {
        [tailNumber in TailNumber]: FlightStatus;
    };

    /**
     * Flight locations by tail number for aircraft which are currently in flight *only.*
     *
     * @private
     */
    readonly flightLocationsByTailNumber: {
        [tailNumber in TailNumber]: FlightLocation;
    };

    /**
     * Date/time at which flight information should next be retrieved.
     */
    nextUpdate: Date;

    tailNumbersToUpdate(check: Date) {
        return Object.entries(this.statusByTailNumber)
            .filter(([, {nextUpdate}]) => nextUpdate <= check)
            .map(([tailNumber]) => tailNumber);
    }

    constructor(
        /**
         * Aircraft in the fleet.
         */
        aircraft: Array<Aircraft>,
        /**
         * Minimum number of milliseconds between flight information updates when an aircraft is in flight.
         */
        private readonly flyingUpdateIntervalMillis: number,
        /**
         * Minimum number of milliseconds between flight information updates when an aircraft is *not* in flight.
         */
        private readonly notFlyingUpdateIntervalMillis: number
    ) {
        const epoch = new Date(0);
        this.nextUpdate = new Date();
        this.flightLocationsByTailNumber = {};
        this.statusByTailNumber = aircraft.reduce((statusByTailNumber, {tailNumber}) => ({
            ...statusByTailNumber,
            [tailNumber]: {
                flying: false,
                nextUpdate: epoch,
                updated: epoch
            }
        }), {});
    }

    /**
     * Reducer for {@link FlightsAction} actions.
     *
     * @param previous the previous state.
     * @param action the action.
     */
    static reduce(previous: FlightsState, action: FlightsAction) {
        const {kind} = action;
        switch (kind) {
            case "flight ended":
                return produce(previous, (draft: FlightsState) => {

                    /* Update flight status, bumping "next update" time if applicable. */
                    const {payload: {tailNumber, updated}} = action,
                        {notFlyingUpdateIntervalMillis, statusByTailNumber: {[tailNumber]: status}} = draft,
                        nextUpdate = new Date(updated.getTime() + notFlyingUpdateIntervalMillis);
                    status.updated = updated;
                    status.nextUpdate = nextUpdate;
                    if (nextUpdate < draft.nextUpdate) {
                        draft.nextUpdate = nextUpdate;
                    }

                    /* Remove from aircraft in flight. */
                    delete draft.flightLocationsByTailNumber[tailNumber];
                });
            case "flight updated":
                return produce(previous, (draft: FlightsState) => {

                    /* Update flight status, bumping "next update" time if applicable. */
                    const {payload: {location: {position, place}, tailNumber, updated}} = action,
                        {flyingUpdateIntervalMillis, statusByTailNumber: {[tailNumber]: status}} = draft,
                        nextUpdate = new Date(updated.getTime() + flyingUpdateIntervalMillis);
                    status.location = Object.assign(status.location || {}, {position, place});
                    status.updated = updated;
                    status.nextUpdate = nextUpdate;
                    if (nextUpdate < draft.nextUpdate) {
                        draft.nextUpdate = nextUpdate;
                    }

                    /* Add or update aircraft in flight. */
                    draft.flightLocationsByTailNumber[tailNumber] = status.location;
                });
            case "status update started":
                return produce(previous, (draft: FlightsState) => {

                    /* Push next update time to "now" + non-flying interval as a minimum retry delay. */
                    const time = action.payload,
                        {notFlyingUpdateIntervalMillis} = draft;
                    draft.nextUpdate = new Date(time.getTime() + notFlyingUpdateIntervalMillis);
                });
        }
    }
}

/**
 * Action to dispatch when a flight ends.
 */
interface FlightEnded {
    kind: "flight ended";
    payload: {
        tailNumber: TailNumber;
        updated: Date;
    };
}

/**
 * Action to dispatch when information on a flight is updated.
 */
interface FlightUpdated {
    kind: "flight updated";
    payload: {
        tailNumber: TailNumber;
        location: FlightLocation;
        updated: Date;
    }
}

/**
 * Action to dispatch immediately prior to beginning a flight status update. Pushes {@link FlightStatus.nextUpdate}
 * ahead for throttling purposes in the event of failure.
 */
interface StatusUpdateStarted {
    kind: "status update started";
    payload: Date;
}

/**
 * Actions which can be performed on a {@link FlightsState} instance.
 */
export type FlightsAction =
    | FlightEnded
    | FlightUpdated
    | StatusUpdateStarted;

/**
 * Status tracking information for an aircraft.
 */
interface FlightStatus {
    location: null | FlightLocation;
    updated: Date;
    nextUpdate: Date;
}

/**
 * Dispatcher of {@link FlightsAction}.
 */
export type FlightsDispatch = Dispatch<FlightsAction>;

/**
 * Reducer for {@link FlightsAction} against a {@link FlightsState}.
 */
export type FlightsReducer = Reducer<FlightsState, FlightsAction>;
