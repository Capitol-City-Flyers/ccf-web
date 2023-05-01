import React, {useMemo} from "react";
import {Link, Outlet} from "react-router-dom";
import logoPng from "../../assets/images/favicon.png";
import {useAuth} from "../../context/AppContext";
import {BrandIconLink} from "../BrandIconLink";
import {NavMenuButton} from "./NavMenuButton";
import {ProfileButton} from "./ProfileButton";

export function PageLayout() {
    const {roles} = useAuth(),
        isAuthenticated = -1 !== roles.indexOf("authenticated"),
        topNavLinks = useMemo(() => (
            <>
                <a href="#">Aircraft</a>
                <Link to="/membership">Membership</Link>
                <a href="#">Contact</a>
            </>
        ), []);
    return (
        <>
            <nav className="ccf-site-nav">
                <div className="w-16">
                    <img className="object-cover" src={logoPng} alt="CCF Logo"/>
                </div>
                <div className="flex font-bold text-xl whitespace-nowrap">
                    <Link to="/">Capitol City Flyers</Link>
                </div>
                <div className="hidden justify-center space-x-2 md:flex md:grow">{topNavLinks}</div>
                <div className="flex grow justify-end space-x-2 md:grow-0">
                    <NavMenuButton>
                        {topNavLinks}
                        <div className="space-x-3">
                            <BrandIconLink className="text-blue-300 hover:text-blue-500"
                                           color="blue"
                                           icon="fa-facebook"
                                           href="https://www.facebook.com/CapitolCityFlyers"/>
                            <BrandIconLink className="text-red-300 hover:text-red-500"
                                           color="red"
                                           icon="fa-youtube"
                                           href="https://www.youtube.com/@CapitolCityFlyers"/>
                        </div>
                    </NavMenuButton>
                    <BrandIconLink className="hidden text-blue-300 hover:text-blue-500 md:inline"
                                   color="blue"
                                   icon="fa-facebook"
                                   href="https://www.facebook.com/CapitolCityFlyers"/>
                    <BrandIconLink className="hidden text-red-300 hover:text-red-500 md:inline"
                                   color="red"
                                   icon="fa-youtube"
                                   href="https://www.youtube.com/@CapitolCityFlyers"/>
                    <ProfileButton/>
                </div>
            </nav>
            <div className={`ccf-content pt-12 ${isAuthenticated ? "md:pl-20" : ""}`}>
                <div className="flex flex-col p-3 pb-16 space-y-3 md:pb-3">
                    <Outlet/>
                </div>
            </div>
            {isAuthenticated && (
                <nav className="ccf-action-nav">
                    <Link to="/members/"><i className="fa fa-user"></i></Link>
                    <a href="#"><i className="fa fa-calendar-days"></i></a>
                    <a href="#"><i className="fa fa-cloud"></i></a>
                    <a href="#"><i className="fa fa-plane-departure"></i></a>
                    <a href="#"><i className="fa fa-camera"></i></a>
                    <a href="#"><i className="fa fa-gear"></i></a>
                </nav>
            )}
        </>
    );
}
