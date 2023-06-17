import {useEffect, useState} from "react";
import _ from "lodash";
import {GeoCoordinates} from "../../navigation/navigation-types";
import {useDatabase} from "../../providers/database/DatabaseContext";
import {WeatherStation} from "../../integrations/faa/nfdc/nfdc-types";

export function useWeatherStations(spec: WeatherStationSpec) {
    const db = useDatabase(),
        [stations, setStations] = useState<Array<WeatherStation>>([]);
    useEffect(() => {
        if (_.isString(spec) || _.isArray(spec)) {
            db.weatherStationsByIdent(spec).then(setStations);
        } else {
            const {center, radius} = spec;
            db.weatherStationsByProximity(center, radius).then(setStations);
        }
    }, [JSON.stringify(spec)]);
    return stations;
}


type WeatherStationIdent = string;

type WeatherStationSpec =
    | WeatherStationIdent
    | Array<WeatherStationIdent>
    | GeographicArea;

interface GeographicArea {
    center: GeoCoordinates;
    radius: number; /* nautical miles. */
}

