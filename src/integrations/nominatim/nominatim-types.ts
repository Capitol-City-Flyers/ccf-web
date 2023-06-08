import {GeoCoordinates} from "../../navigation/navigation-types";

/**
 * Interface to a service which provides reverse geolocation from geographic coordinates to place names.
 */
export interface ReverseGeoProvider {

    /**
     * Retrieve a geographic place name for a given set of geographic coordinates, or `null` if no name is available.
     *
     * @param coords the geographic coordinates.
     */
    retrievePlace(coords: GeoCoordinates): Promise<null | string>;
}

