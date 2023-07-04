import {PropsWithChildren, useEffect, useMemo, useState} from "react";
import {DOM_PARSER} from "@capitol-city-flyers/ccf-web-integration";
import {freeze, produce} from "immer";
import _ from "lodash";
import {parseTAF} from "metar-taf-parser";
import {NWSClient} from "../../integrations/nws/NWSClient";
import {useAxiosInstance} from "../../providers/axios/AxiosInstanceContext";
import {EPOCH_UTC, resolveDayTime} from "../../utilities/date-utils";
import {FlightCategoryInterval} from "../../utilities/weather-types";
import {tafFlightCategories} from "../../utilities/weather-utils";
import PeriodSegmentsPanel from "../chrono/PeriodSegmentsPanel";
import {DateTime, DurationLike, Interval} from "luxon";
import FlightCategorySegment from "./FlightCategorySegment";

/**
 * Properties for a {@link FlightCategoryPanel} component.
 */
interface FlightCategoryPanelProps {
    station: string;
}

/**
 * {@link FlightCategoryPanel} renders a full-width div with segments representing periods of IFR, low IFR, marginal VFR
 * and VFR flight conditions according to a station TAF.
 *
 * @param props the component properties.
 * @constructor
 */
export default function FlightCategoryPanel(props: PropsWithChildren<FlightCategoryPanelProps>) {
    const {station} = props;
    const axios = useAxiosInstance({
        baseURL: "./api/aviationweather/"
    });
    const client = useMemo(() => NWSClient.create(axios, DOM_PARSER), [axios]);
    const [state, updateState] = useState(() => {
        const localMidnight = DateTime.now().startOf("day");
        return freeze<PanelState>({
            day: localMidnight.until(localMidnight.endOf("day")),
            update: EPOCH_UTC,
            segments: []
        });
    });

    /* Update the TAF when station changes or update date/time is reached. */
    const {update} = state;
    useEffect(() => {
        const delayMillis = Math.max(0, DateTime.now().until(update).length("milliseconds"));
        const interval = setTimeout(() => {
            const nowLocal = DateTime.now();
            const day = nowLocal.startOf("day").until(nowLocal.endOf("day"));
            client.getMetarsAndTAFs(0, station)
                .then(({stations}) => {
                    if (!stations[station]) {
                        updateState({
                            segments: [],
                            day: day,
                            update: DateTime.fromMillis(Number.MAX_SAFE_INTEGER)
                        });
                    } else {
                        /* Parse the TAF; get validity dates and determine flight categories. */
                        const nowUTC = nowLocal.toUTC();
                        const parsed = parseTAF(stations[station].taf.join("\n"));
                        const issued = resolveDayTime(nowUTC, parsed.day, parsed.hour, parsed.minute);
                        const {validity} = parsed;
                        const valid = resolveDayTime(nowUTC, validity.startDay, validity.startHour)
                            .until(resolveDayTime(nowUTC, validity.endDay, validity.endHour));
                        const categories = tafFlightCategories(nowUTC, parsed);

                        /* Update state with current categories, period, and next update date/time. Check for reissue six
                        hours after current issue and every five minutes thereafter (until reissued.) */
                        let reissue = _.max([issued.plus(SIX_HOURS), nowUTC.plus(FIVE_MINUTES)]);
                        updateState(previous => produce(previous, draft => {
                            draft.segments = categories;
                            draft.day = day;
                            draft.update = _.min([day.start, valid.end, reissue]);
                        }));
                    }
                });
        }, delayMillis);
        return () => clearTimeout(interval);
    }, [update.toMillis(), station]);
    const {day, segments} = state;
    return (<PeriodSegmentsPanel period={day} segments={segments} segmentComponent={FlightCategorySegment}/>);
}

/**
 * Backing state for a {@link FlightCategoryPanel}.
 */
interface PanelState {
    segments: FlightCategoryInterval[];
    day: Interval;
    update: DateTime;
}

const FIVE_MINUTES: DurationLike = freeze({minutes: 5});
const SIX_HOURS: DurationLike = freeze({hours: 6});