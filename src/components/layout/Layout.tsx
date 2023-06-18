import React, {PropsWithChildren, useEffect, useMemo, useRef} from "react";
import {faFacebook, faYoutube} from "@fortawesome/free-brands-svg-icons";
import {faCalendarDays, faCamera, faCloud, faGear, faPlaneDeparture, faUser} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useApp} from "../../providers/app/AppContext";
import logoPng from "../../../public/images/favicon.png";
import BrandIconLink from "./BrandIconLink";
import NavMenuButton from "./NavMenuButton";
import PageLink from "./PageLink";
import {ProfileButton} from "./ProfileButton";

export default function Layout({children}: PropsWithChildren) {
    const isAuthenticated = false,
        {env, state: {status: {client: {standalone}}}} = useApp(),
        appRef = useRef<HTMLDivElement>(),
        topNavLinks = useMemo(() => (
            <>
                <a href="#">Aircraft</a>
                <PageLink href="/membership">Membership</PageLink>
                <a href="#">Contact</a>
                <PageLink href="/credits">Credits</PageLink>
            </>
        ), []);
    useEffect(() => {
        if (standalone) {
            appRef.current.classList.add("ccf-standalone");
        }
    }, []);
    return (
        <div ref={appRef} className="ccf-app">
            <nav className="ccf-site-nav">
                <div className="w-16">
                    <img className="object-cover" src={logoPng.src} alt="CCF Logo"/>
                </div>
                <div className="flex font-bold text-xl whitespace-nowrap">
                    <PageLink href="/">Capitol City Flyers</PageLink>
                </div>
                <div className="hidden justify-center space-x-2 md:flex md:grow">{topNavLinks}</div>
                <div className="flex grow justify-end space-x-2 md:grow-0">
                    <NavMenuButton>
                        {topNavLinks}
                        <div className="flex space-x-3">
                            <BrandIconLink className="text-blue-300 transition-colors hover:text-blue-500"
                                           href="https://www.facebook.com/CapitolCityFlyers"
                                           icon={faFacebook}/>
                            <BrandIconLink className="text-red-300 transition-colors hover:text-red-500"
                                           href="https://www.youtube.com/@CapitolCityFlyers"
                                           icon={faYoutube}/>
                        </div>
                    </NavMenuButton>
                    <div className="hidden space-x-2 md:flex">
                        <BrandIconLink className="text-blue-300 transition-colors hover:text-blue-500"
                                       href="https://www.facebook.com/CapitolCityFlyers"
                                       icon={faFacebook}/>
                        <BrandIconLink className="text-red-300 transition-colors hover:text-red-500"
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
                    <PageLink href="/members"><FontAwesomeIcon icon={faUser}/></PageLink>
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
