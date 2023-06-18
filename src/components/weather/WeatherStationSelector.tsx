import {useAppStatus} from "../../providers/app/AppContext";
import {GeoCoordinates} from "../../navigation/navigation-types";
import {useWeatherStations} from "./WeatherStationHooks";
import {ChangeEvent, useCallback, useState} from "react";

interface WeatherStationSelectorProps {
    ident?: string;
    position?: GeoCoordinates;
}

export default function WeatherStationSelector(props: WeatherStationSelectorProps) {
    const {position} = useAppStatus(),
        [radius, setRadius] = useState(25),
        stations = useWeatherStations({center: position, radius});
    const onRadiusChange = useCallback(({target: {value}}: ChangeEvent<HTMLSelectElement>) => {
        setRadius(parseInt(value, 10));
    }, [setRadius]);
    return (
        <div>
            <label>
                Radius (nm):&nbsp;<select value={radius} onChange={onRadiusChange}>
                {radii.map(radius => (
                    <option key={radius} value={radius}>{radius}</option>
                ))}
            </select>
            </label>
            <ul>
                {stations.map(({ident, cityName, stateCode}) => (
                    <ul key={ident}>{cityName}, {stateCode} ({ident})</ul>
                ))}
            </ul>
        </div>
    );
}

interface WeatherStationSelectorState {
    ident?: string;
    position?: GeoCoordinates;
}

const radii = [
    5,
    10,
    25,
    50,
    100
];
