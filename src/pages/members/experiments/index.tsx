import {useAppStatus, usePrefs} from "../../../providers/app/AppContext";
import WeatherStationSelector from "../../../components/weather/WeatherStationSelector";
import {useNominatimClient} from "../../../integrations/nominatim/NominatimContext";
import {useEffect, useState} from "react";
import DailyAvailability from "../../../components/schedule/DailyAvailability";
import DaySegmentsPanel from "../../../components/chrono/DaySegmentsPanel";
import {DateTime} from "luxon";
import FlightCategoryPanel from "../../../components/weather/FlightCategoryPanel";


function PositionLabel() {
    const nominatim = useNominatimClient(),
        {position} = useAppStatus(),
        [place, setPlace] = useState<string>();
    useEffect(() => {
        if (null == position) {
            setPlace(null);
        } else {
            nominatim.retrievePlace(position).then(setPlace);
        }
    }, [position]);
    return !position ? (
        <span>Position not received</span>
    ) : (
        <span>
            Your approximate location is ({position.latitude}, {position.longitude})
            {place && (<>, near <em>{place}</em></>)}.
        </span>
    );
}

export default function MemberExperimentsPage() {
    const {device: {enableGeolocation, install}} = usePrefs(),
        canDisplayWeatherStationSelector = enableGeolocation && install;
    return (
        <section>
            <div className="py-2">
                <strong>Fun with reverse geolocation</strong>
                <div>
                    {!enableGeolocation ? (
                        <span>Cannot display position because geolocation must be enabled in preferences.</span>
                    ) : (
                        <PositionLabel/>
                    )}
                </div>
            </div>
            <div className="py-2">
                <strong>Nearby weather stations</strong>
                <div>
                    {!canDisplayWeatherStationSelector ? (
                        <span>Cannot display weather stations because device install and geolocation must be enabled in preferences.</span>
                    ) : (
                        <WeatherStationSelector/>
                    )}
                </div>
            </div>
            <div className="py-2">
                <strong>Daily availability</strong>
                <DailyAvailability/>
            </div>
            <DaySegmentsPanel date={DateTime.now()} position={{latitude: 43.2869331, longitude: -89.7240116}}>
                This is only a test
            </DaySegmentsPanel>
            <div className="relative">
                <div className="absolute left-0 top-0 w-full">
                    <FlightCategoryPanel station="KEAU">
                        This is only a test
                    </FlightCategoryPanel>
                </div>
            </div>
        </section>
    );
}
