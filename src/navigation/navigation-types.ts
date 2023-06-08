
export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}

export interface GeoPosition extends GeoCoordinates {
    altitude?: number;
    heading?: number;
}
