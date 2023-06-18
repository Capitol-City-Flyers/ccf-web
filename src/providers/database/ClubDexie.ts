import Dexie, {Table} from "dexie";
import _ from "lodash";
import type {Airport, WeatherStation} from "../../integrations/faa/nfdc/nfdc-types";
import {GeoCoordinates} from "../../navigation/navigation-types";
import {flattenValues} from "../../utilities/array-utils";
import {proximityBounds, pointToPointCourseDistance} from "../../utilities/geo-utils";

export class ClubDexie extends Dexie {
    airport: Table<Airport>;
    weatherStation: Table<WeatherStation>;

    constructor() {
        super("club");
        this.version(1)
            .stores({
                airport: "key, coordinates.latitude, coordinates.longitude, icaoIdent",
                weatherStation: "key, coordinates.latitude, coordinates.longitude"
            });
    }

    /**
     * Get zero or more weather stations by identifier, sorted by *ascending* identifier.
     *
     * @param first the first identifier(s).
     * @param additional the additional identifier(s).
     */
    async weatherStationsByIdent(first: string | Array<string>, ...additional: Array<string | Array<string>>) {
        const idents = flattenValues(first, ...additional),
            keys = _.map(idents, ident => `nasr:2023-06-15:${ident}`);
        return this.weatherStation.where("key")
            .anyOf(keys)
            .toArray()
            .then(stations => _.sortBy(stations, "ident"));
    }

    /**
     * Get all weather stations within some distance in nautical miles of a center point, sorted by *ascending* distance
     * from the center point.
     *
     * @param center the center point.
     * @param distance the distance.
     */
    async weatherStationsByProximity(center: GeoCoordinates, distance: number) {
        const bounds = proximityBounds(center, distance);
        return this.weatherStation.where("coordinates.latitude")
            .inAnyRange([[bounds[0].latitude, bounds[1].latitude]])
            .filter(({coordinates}) =>
                coordinates.longitude >= bounds[0].longitude
                && coordinates.longitude <= bounds[1].longitude
                && pointToPointCourseDistance(center, coordinates).distance <= distance
            )
            .toArray()
            .then(stations => sortByDistance(stations, center));
    }
}

function sortByDistance<T extends GeoPositioned>(records: Array<T>, center: GeoCoordinates) {
    return _.sortBy(records, ({coordinates}) =>
        pointToPointCourseDistance(center, coordinates).distance);
}

type GeoPositioned = {
    coordinates: GeoCoordinates
};
