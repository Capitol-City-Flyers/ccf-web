import React, {AnchorHTMLAttributes, useMemo} from "react";

interface BrandIconLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {

    /**
     * TailwindCSS color name. Hover uses luminance 500, normal uses luminance 300.
     */
    color: string;

    /**
     * FontAwesome icon class.
     */
    icon: `fa-${string}`;
    href: string;
}

export function BrandIconLink({color, icon, href, ...rest}: BrandIconLinkProps) {
    const iconClassNames = useMemo(() => [
        "cursor-pointer", "fab", icon, "text-3xl", `text-${color}-300`, `hover:text-${color}-500`, "drop-shadow-sm"
    ].join(" "), [color, icon]);
    return (
        <a href={href} target="__blank" {...rest}>
            <i className={iconClassNames}></i>
        </a>
    );
}
