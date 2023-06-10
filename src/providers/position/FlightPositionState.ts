import {freeze, immerable} from "immer";
import _ from "lodash";
import {AircraftConfig} from "../../config-types";
import {GeoPosition} from "../../navigation/navigation-types";
import {DateTime} from "luxon";
import {EPOCH_UTC} from "../../utilities/date-utils";

export class FlightPositionState {
    [immerable] = true;

    readonly tracking: Array<{
        aircraft: AircraftConfig;
        status:
            | "undetermined"
            | "notTracking"
            | TrackingStatus;
        updated: DateTime;
    }>;

    private constructor(private aircraft: Array<AircraftConfig>) {
        this.tracking = _.map(aircraft, aircraft => ({
            status: "undetermined",
            updated: EPOCH_UTC,
            aircraft
        }) as const);
    }

    static reduce(previous: FlightPositionState, action: FlightPositionAction) {
        return previous;
    }

    static create(aircraft: Array<AircraftConfig>) {
        return freeze(new FlightPositionState(_.cloneDeep(aircraft)), true);
    }
}


interface TrackingStatus {
    place?: string;
    position: GeoPosition;
}

type FlightPositionAction = never;
