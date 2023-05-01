import React, {useMemo} from "react";
import {Interval} from "luxon";
import {ClubAircraft} from "../../../../integrations/IntegrationTypes";
import {toLengthFractions, toTransitions} from "../../../../utils/DateUtils";
import {toPercent} from "../../../../utils/MathUtils";

interface AvailabilityTimelineProps {
    aircraft: ClubAircraft;
    available: Array<Interval>;
    interval: Interval;
}

export function AvailabilityTimeline({aircraft, available, interval}: AvailabilityTimelineProps) {
    const transitions = toTransitions(available),
        widths = useMemo(() => toLengthFractions(interval, transitions).map(toPercent),
            [interval, transitions.map(transition => transition.toMillis())]);
    return (
        <div className="availability">
            {widths.map((width, index) => 0 === width ? null : (
                <span key={`availability[${index}]`}
                      className={0 !== index % 2 ? "available" : "unavailable"}
                      style={{width: `${width}%`}}>
                    &nbsp;
                </span>
            ))}
            <label>{aircraft.tailNumber}</label>
        </div>
    );
}
