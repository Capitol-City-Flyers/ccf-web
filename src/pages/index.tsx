import fleetJpg from "../../public/images/cap-city-flyers-fleet.jpg";
import AircraftGallery from "../components/aircraft/AircraftGallery";

export default function Home() {
    return (
        <>
            <section className="flex flex-col space-y-3 test-justify md:flex-row md:space-x-3 place-items-center">
                <div className="relative md:w-2/3">
                    <div className="absolute w-full pt-10 text-center text-white z-10">
                        <div className="font-extrabold text-xl md:text-lg lg:text-2xl">
                            Madison's Premier Flying Club
                        </div>
                        <div className="italic md:font-light">
                            A plane for every mission
                        </div>
                    </div>
                    <div className="overflow-clip rounded-2xl shadow-md">
                        <img src={fleetJpg.src} alt="Fleet"/>
                    </div>
                </div>
                <div className="md:w-1/3">
                    <div
                        className="md:border relative z-10 space-y-3 md:bg-blue-50 md:bg-opacity-95 md:-ml-20 md:p-6 md:rounded-2xl md:shadow-xl">
                        <p>
                            <span className="text-xl font-extrabold">Capitol City Flyers</span> is Madison's
                            premier member-owned flying club, operating out
                            of <a className="drop-shadow-md" href="https://www.msnairport.com/">Dane County
                            Regional Airport</a> for over 60 years. We own and operate 3 IFR-certified aircraft:
                            a <a className="drop-shadow-md" href="src/main/webpack/pages/index#">Diamond
                            DA40</a> with a Garmin G1000 glass cockpit,
                            a <a className="drop-shadow-md" href="src/main/webpack/pages/index#">Cessna
                            Skylane</a> with retractable landing gear, and
                            a <a className="drop-shadow-md" href="src/main/webpack/pages/index#">Piper
                            Archer</a>. Come join our group of like minded pilots!
                        </p>
                        <p>
                            <span className="text-xl font-extrabold">Our Mission</span> is to promote safe,
                            enjoyable flying and related activities, and to provide the opportunity for our members
                            to fly economically and conveniently, with excellent service and support.
                        </p>
                    </div>
                </div>
            </section>
            <section className="flex">
                <AircraftGallery/>
            </section>
            <footer className="grow container relative mx-auto">
                <div
                    className="flex flex-col space-y-3 pb-3 md:pb-0 sm:space-y-0 sm:items-center sm:justify-between sm:flex-row">
                    <div>
                        <div className="text-lg font-extrabold">Capitol City Flyers</div>
                        <div className="text-sm">
                            <div className="italic">
                                Madison's premier member-owned flying club
                            </div>
                            <div>
                                <a className="drop-shadow-md" href="https://www.airnav.com/airport/KMSN">Dane County
                                    Regional Airport</a>
                            </div>
                            <div>
                                Madison, Wisconsin
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="text-lg font-extrabold">Contact</div>
                        <div className="text-sm">
                            <div>
                                <a className="drop-shadow-md"
                                   href="mailto:info@capcityflyers.com">info@capcityflyers.com</a>
                            </div>
                            <div>
                                3499 Miller St, Madison, WI, 53704
                            </div>
                            <div>
                                <a className="drop-shadow-md" href="tel:608-220-6281">608-220-6281</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
