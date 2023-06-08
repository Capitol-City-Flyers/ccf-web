import React, {AnchorHTMLAttributes, useMemo} from "react";
import {IconDefinition} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface BrandIconLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    icon: IconDefinition;
    href: string;
}

export default function BrandIconLink({className, href, icon}: BrandIconLinkProps) {
    return (
        <a href={href} target="__blank" className="flex items-center">
            <FontAwesomeIcon className={`w-8 ${className}`} icon={icon}/>
        </a>
    );
}
