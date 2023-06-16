import React, {PropsWithChildren, useMemo} from "react";
import Link from "next/link";
import {faFacebook, faYoutube} from "@fortawesome/free-brands-svg-icons";
import {faCalendarDays, faCamera, faCloud, faGear, faPlaneDeparture, faUser} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import logoPng from "../../../public/images/favicon.png";
import BrandIconLink from "./BrandIconLink";
import NavMenuButton from "./NavMenuButton";
import {ProfileButton} from "./ProfileButton";
import {useApp} from "../../providers/app/AppContext";
import type {Environment} from "../../config-types";

export default function Layout({children}: PropsWithChildren) {
    const isAuthenticated = false,
        {env} = useApp(),
        appClasses = useMemo(() => [
            "ccf-app",
            ...(checkStandalone(env) ? ["ccf-standalone"] : [])
        ].join(" "), []),
        topNavLinks = useMemo(() => (
            <>
                <a href="#">Aircraft</a>
                <Link href="/membership">Membership</Link>
                <a href="#">Contact</a>
            </>
        ), []);
    return (
        <div className={appClasses}>
            <nav className="ccf-site-nav">
                <div className="w-16">
                    <img className="object-cover" src={logoPng.src} alt="CCF Logo"/>
                </div>
                <div className="flex font-bold text-xl whitespace-nowrap">
                    <Link className="hover:text-blue-500" href="/">Capitol City Flyers</Link>
                </div>
                <div className="hidden justify-center space-x-2 md:flex md:grow">{topNavLinks}</div>
                <div className="flex grow justify-end space-x-2 md:grow-0">
                    <NavMenuButton>
                        {topNavLinks}
                        <div className="flex space-x-3">
                            <BrandIconLink className="text-blue-300 hover:text-blue-500"
                                           href="https://www.facebook.com/CapitolCityFlyers"
                                           icon={faFacebook}/>
                            <BrandIconLink className="text-red-300 hover:text-red-500"
                                           href="https://www.youtube.com/@CapitolCityFlyers"
                                           icon={faYoutube}/>
                        </div>
                    </NavMenuButton>
                    <div className="hidden space-x-2 md:flex">
                        <BrandIconLink className="text-blue-300 hover:text-blue-500"
                                       href="https://www.facebook.com/CapitolCityFlyers"
                                       icon={faFacebook}/>
                        <BrandIconLink className="text-red-300 hover:text-red-500"
                                       href="https://www.youtube.com/@CapitolCityFlyers"
                                       icon={faYoutube}/>
                    </div>
                    <ProfileButton/>
                </div>
            </nav>
            <div className={`ccf-content pt-12 ${isAuthenticated ? "md:pl-20" : ""}`}>
                <div className="flex flex-col p-3 pb-16 space-y-3 md:pb-3">
                    {children}
                </div>
            </div>
            {isAuthenticated && (
                <nav className="ccf-action-nav">
                    <Link href="/members"><FontAwesomeIcon icon={faUser}/></Link>
                    <a href="#"><FontAwesomeIcon icon={faCalendarDays}/></a>
                    <a href="#"><FontAwesomeIcon icon={faCloud}/></a>
                    <a href="#"><FontAwesomeIcon icon={faPlaneDeparture}/></a>
                    <a href="#"><FontAwesomeIcon icon={faCamera}/></a>
                    <a href="#"><FontAwesomeIcon icon={faGear}/></a>
                </nav>
            )}
        </div>
    );
}

function checkStandalone(env: Environment) {
    if ("_build" === env) {
        return false;
    }
    const {navigator} = window;
    if (window.matchMedia("(display-mode: standalone)").matches) {
        console.debug("Determined standalone state [true] via media query.");
        return true;
    } else if ("standalone" in navigator) {
        const standalone = !!navigator.standalone;
        console.debug(`Determined standalone state [${standalone}] via Navigator.`);
        return standalone;
    }
    console.debug("Returning standalone state [false] by default.");
    return false;
}
