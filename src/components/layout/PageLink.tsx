import {HTMLAttributes, PropsWithChildren, useCallback, useEffect, useRef} from "react";
import {useAppStatus} from "../../providers/app/AppContext";
import Link from "next/link";
import {useRouter} from "next/router";
import {isAnchorElement} from "../../utilities/dom-utils";

/**
 * Properties for a {@link PageLink} component.
 */
interface PageLinkProps extends HTMLAttributes<HTMLAnchorElement> {
    href: string;
}

/**
 * {@link PageLink} is a wrapper around a {@link Link} element which overrides the default `click` behavior of the link
 * when running in standalone mode, navigating via the router instead. This prevents links from opening in a separate
 * browser frame when running from the home screen in iOS.
 *
 * @param props the component properties.
 * @constructor
 */
export default function PageLink(props: PropsWithChildren<PageLinkProps>) {
    const {children, href, ...rest} = props,
        {client: {standalone}} = useAppStatus(),
        anchorRef = useRef<HTMLAnchorElement>(),
        router = useRouter();
    const onLinkClick = useCallback((ev: MouseEvent) => {
        const {target} = ev;
        if (isAnchorElement(target)) {
            console.debug(`Routing link to [${href}].`);
            ev.preventDefault();
            router.push(href).then();
        }
    }, [router]);
    const anchor = anchorRef.current;
    useEffect(() => {
        console.log(`Standalone? ${standalone}.`);
        if (null != anchor && standalone) {
            anchor.addEventListener("click", onLinkClick);
            return () => anchor.removeEventListener("click", onLinkClick);
        }
    }, [anchor]);
    return (<Link ref={anchorRef} href={href} {...rest}>{children}</Link>);
}