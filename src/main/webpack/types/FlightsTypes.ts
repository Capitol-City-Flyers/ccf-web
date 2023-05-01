/**
 * 2-dimensional geographic coordinates.
 */
export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}

/**
 * Geographic coordinates with optional altitude and/or true-degree track.
 */
export interface GeoPosition extends GeoCoordinates {
    altitude?: number;
    track?: number;
}

/**
 * Location of a flight with optional geographic place name.
 */
export interface FlightLocation {
    place?: string;
    position: GeoPosition;
}

/**
 * Interface to a service which provides live position data for an aircraft based on a Mode S code.
 */
export interface FlightInfoProvider {

    /**
     * Retrieve current position data for an aircraft, or `null` if data is not available or the aircraft is not in
     * flight.
     *
     * @param modeSCode the Mode S code.
     */
    retrievePosition(modeSCode: string): Promise<null | GeoPosition>;
}

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

