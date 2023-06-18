import {useAppStatus, usePrefs} from "../../../providers/app/AppContext";
import WeatherStationSelector from "../../../components/weather/WeatherStationSelector";
import {useNominatimClient} from "../../../integrations/nominatim/NominatimContext";
import {useEffect, useState} from "react";


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
        </section>
    );
}
