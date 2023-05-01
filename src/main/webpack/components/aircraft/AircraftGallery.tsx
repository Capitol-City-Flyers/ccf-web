import React from "react";
import {FlightsProvider} from "../flights/FlightsProvider";
import {AircraftGalleryItem} from "./AircraftGalleryItem";
import {Aircraft} from "../../data";

/**
 * Properties for an {@link AircraftGallery} component.
 */
interface AircraftGalleryProps {
    aircraft: Array<Aircraft>;
}

export function AircraftGallery({aircraft}: AircraftGalleryProps) {
    return (
        <div className="block md:flex md:flex-row md:space-x-3">
            <FlightsProvider aircraft={aircraft}>
                {aircraft.map((aircraft, index) => (
                    <div key={aircraft.tailNumber}
                         className={`${0 !== index ? "hidden" : ""} overflow-hidden relative rounded-b-xl shadow-md text-center md:block md:space-y-3`}>
                        <AircraftGalleryItem aircraft={aircraft}/>
                    </div>
                ))}
            </FlightsProvider>
        </div>
    );
}
