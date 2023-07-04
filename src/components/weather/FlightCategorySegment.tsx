import {SegmentComponentProps} from "../chrono/PeriodSegmentsPanel";
import {FlightCategoryInterval} from "../../utilities/weather-types";
import {useMemo} from "react";
import {useMessages} from "../../providers/messages/MessagesContext";
import {freeze} from "immer";
import colors from "tailwindcss/colors";
import {DateTime} from "luxon";

/**
 * {@link FlightCategorySegment} is a single segment reflected in a {@link FlightCategoryPanel}.
 *
 * @param props
 * @constructor
 */
export default function FlightCategorySegment(props: SegmentComponentProps<FlightCategoryInterval>) {
    const {segment} = props;
    const {category, interval: {end, start}} = segment;
    const messagesSpec = useMemo(() => ({
        tooltip: {
            message: `cin.tooltip.flight-categories.${category}`,
            params: [
                start.toLocal().toLocaleString(DateTime.DATETIME_SHORT),
                end.toLocal().toLocaleString(DateTime.DATETIME_SHORT)
            ]
        }
    }), [category, start.toMillis(), end.toMillis()]);
    const messages = useMessages(messagesSpec);
    return (
        <div className={`cursor-pointer inline-block min-w-full w-full tooltip ${categoryClasses[category]}`}
             data-tip={messages.tooltip}>
            &nbsp;
        </div>
    );
}

/**
 * Colors used to reflect flight categories.
 */
const categoryClasses = freeze<{ [Category in FlightCategoryInterval["category"]]: string }>({
    "ifr": "bg-red-300",
    "lifr": "bg-fuchsia-300",
    "mvfr": "bg-violet-300",
    "vfr": "bg-green-300"
});
