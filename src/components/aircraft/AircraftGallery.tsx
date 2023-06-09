import {useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {StaticImageData} from "next/image";
import {TailNumber} from "../../aircraft/aircraft-types";
import {useConfig} from "../../providers/app/AppContext";
import FlightStatus from "./FlightStatus";
import FlyingRibbon from "./FlyingRibbon";

import n271rg from "../../../public/images/N271RG_-_Profile_Down.jpg";
import n569ds from "../../../public/images/N569DS_-_nose_skyward.jpg";
import n8113b from "../../../public/images/N8113B_-_Profile.jpg";

/**
 * {@link AircraftGallery} displays basic information and a single image for each aircraft. On medium or larger windows
 * (non-mobile) displays all aircraft at once. On smaller windows, displays them one at a time as a carousel.
 *
 * @constructor
 */
export default function AircraftGallery() {
    const {operator: {aircraft}} = useConfig(),
        galleryAircraft = useMemo(() => freeze(_.sortBy(aircraft, "tailNumber")
            .map(aircraft => ({
                image: aircraftImages[aircraft.tailNumber],
                ...aircraft
            })), true), [aircraft]);
    return (
        <>
            <div className="hidden space-x-3 md:flex md:flex-row">
                {galleryAircraft.map((aircraft) => (
                    <div key={aircraft.tailNumber}
                         className="flex-col overflow-hidden relative rounded-box shadow-md w-1/3">
                        <img src={aircraft.image.src} alt={aircraft.tailNumber}/>
                        <div className="flex flex-col p-3 place-items-center">
                            <h2>{aircraft.tailNumber}</h2>
                        </div>
                        <FlightStatus aircraft={aircraft} component={FlyingRibbon}/>
                    </div>
                ))}
            </div>
            <div className="carousel rounded-box shadow-md w-full md:hidden">
                {galleryAircraft.map((aircraft, index) => (
                    <div key={aircraft.tailNumber}
                         id={`slide${index}`}
                         className="carousel-item flex-col relative w-full">
                        <div className="relative">
                            <img src={aircraft.image.src} alt={aircraft.tailNumber}/>
                            <div
                                className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                                <a href={`#slide${(index + 2) % 3}`} className="btn btn-circle btn-sm opacity-75">❮</a>
                                <a href={`#slide${(index + 1) % 3}`} className="btn btn-circle btn-sm opacity-75">❯</a>
                            </div>
                        </div>
                        <div className="flex flex-col p-3 place-items-center">
                            <h2>{aircraft.tailNumber}</h2>
                        </div>
                        <FlightStatus aircraft={aircraft} component={FlyingRibbon}/>
                    </div>
                ))}
            </div>
        </>
    );
}

const aircraftImages = freeze<{ [K in TailNumber]: StaticImageData }>({
    "N271RG": n271rg,
    "N569DS": n569ds,
    "N8113B": n8113b
});
