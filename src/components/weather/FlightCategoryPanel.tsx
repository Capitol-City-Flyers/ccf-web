import {PropsWithChildren, useEffect, useMemo, useState} from "react";
import {NWSClient} from "../../integrations/nws/NWSClient";
import {useAxiosInstance} from "../../providers/axios/AxiosInstanceContext";
import {DOM_PARSER} from "@capitol-city-flyers/ccf-web-integration";
import {nowUTC} from "../../utilities/date-utils";
import {conditionIntervals, FlightCategoryInterval} from "../../utilities/weather-utils";
import {parseMetar, parseTAF} from "metar-taf-parser";
import {freeze} from "immer";
import colors from "tailwindcss/colors";

interface FlightCategoryPanelProps {
    station: string;
}

export default function FlightCategoryPanel(props: PropsWithChildren<FlightCategoryPanelProps>) {
    const {station} = props;
    const axios = useAxiosInstance({
        baseURL: "./api/aviationweather/"
    });
    const client = useMemo(() => NWSClient.create(axios, DOM_PARSER), [axios]);
    const [categories, setCategories] = useState<FlightCategoryInterval[]>([]);

    useEffect(() => {
        const now = nowUTC();
        const day = now.startOf("day").until(now.endOf("day"));
        const {hours} = now.diff(day.start, "hours");
        client.getMetarsAndTAFs(Math.floor(hours) + 1, station)
            .then(({stations: {[station]: {metars, taf}}}) => {
                console.dir({metars, taf});
                const categories = conditionIntervals(now, parseTAF(taf.join("\n")), metars.map(metar => parseMetar(metar)))
                    .filter(({interval}) => interval.overlaps(day));
                setCategories(categories);
            });
    }, []);

    console.dir(categories.map(({interval, category}) => ({
        interval: interval.toISO(),
        category
    })));

    return (
        <div>

        </div>
    );
}

/**
 * Generate the background gradient which indicates night, civil twilight, etc.
 *
 * @param intervals the raw solar interval data.
 */
function categoryGradient(intervals: Array<FlightCategoryInterval>) {
    console.dir(intervals);
}

/**
 * Colors and tooltip message keys used in the interval gradient:
 * * AM night
 * * Hour before sunrise
 * * Morning civil twilight
 * * Daylight
 * * Evening civil twilight
 * * Hour after sunset
 * * PM night
 */
const categoryColors = freeze<{ [Category in FlightCategoryInterval["category"]]: string }>({
    "IFR": colors.red[300],
    "LIFR": colors.fuchsia[300],
    "MVFR": colors.violet[300],
    "VFR": colors.green[300]
});
