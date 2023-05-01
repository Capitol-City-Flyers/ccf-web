import React from "react";
import {useFlights} from "../../context/FlightsContext";
import {Aircraft} from "../../data";
import {Requires} from "../auth/Requires";
import {ActionButton} from "../layout/ActionButton";

interface AircraftGalleryItemProps {
    aircraft: Aircraft;
}

export function AircraftGalleryItem({aircraft}: AircraftGalleryItemProps) {
    const {model, tailNumber, photo} = aircraft,
        {[tailNumber]: flight} = useFlights();
    return (
        <figure className="md:max-w-lg">
            <img className="rounded-t-2xl" src={photo} alt={tailNumber}/>
            <div
                className="md:hidden absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                <a href="src/main/webpack/components/aircraft#" className="btn btn-circle">❮</a>
                <a href="src/main/webpack/components/aircraft#" className="btn btn-circle">❯</a>
            </div>
            <div className="flex flex-col items-center p-3 space-y-3">
                <figcaption>
                    {model} <span className="font-extrabold">{tailNumber}</span>
                </figcaption>
                <div className="flex-col py-2 space-x-2">
                    <ActionButton>View</ActionButton>
                    <Requires member>
                        <ActionButton>Reserve</ActionButton>
                    </Requires>
                </div>
            </div>
            {flight && (
                <div className="ribbon leading-tight opacity-90 text-xs">
                    <div className="font-bold">I'm flying!</div>
                    {flight?.place && (
                        <div>
                            near <a href={`https://flightaware.com/live/flight/${tailNumber}`}
                                    target="_blank">{flight.place}</a>
                        </div>
                    )}
                </div>
            )}
        </figure>
    );
}
