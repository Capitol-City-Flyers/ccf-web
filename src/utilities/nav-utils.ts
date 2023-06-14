import {GeoCoordinates} from "../navigation/navigation-types";
import {ComputeFormDir} from "../../__tests__/utilities/nav-utils.test";

function mod(y: number, x: number) {
    return y - x * Math.floor(y / x);
}

export function pointRadialDistance(point: GeoCoordinates, radial: number, distance: number) {

    // lat=asin(sin(lat1)*cos(d)+cos(lat1)*sin(d)*cos(tc))
    // IF (cos(lat)=0)
    // lon=lon1      // endpoint a pole
    // ELSE
    // lon=mod(lon1-asin(sin(tc)*sin(d)/cos(lat))+pi,2*pi)-pi
    // ENDIF

    ComputeFormDir()

    const d = (Math.PI / (180 * 60)) * distance;
    const tc = radial * (Math.PI / 180),
        {latitude: lat1, longitude: lon1} = point,
        lat = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(tc));
    if (0 === Math.cos(lat)) {
        return {latitude: lat, longitude: lon1};
    }
    const lon = mod(lon1 - Math.asin(Math.sin(tc) * Math.sin(d) / Math.cos(lat)) + Math.PI, 2 * Math.PI) - Math.PI;
    return {
        latitude: lat,
        longitude: lon
    };
}
