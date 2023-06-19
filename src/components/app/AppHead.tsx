import Head from "next/head";
import {useMessages} from "../../providers/messages/MessagesContext";

import appleTouchIcon180x180 from "../../../public/images/apple-touch-icon-180x180.png";
import faviconPng from "../../../public/images/favicon.png";

/**
 * [AppHead] renders application link and metadata tags.
 *
 * @constructor
 */
export default function AppHead() {
    const messages = useMessages({
        iosHomeScreenTitle: "ccf.ios.home-screen.title",
        orgDescription: "ccf.org.description",
        siteTitle: "ccf.site.title"
    });
    return (
        <Head>
            <title>{messages.siteTitle}</title>
            <link rel="icon" href={faviconPng.src}/>
            <link rel="manifest" href="/manifest.json"/>
            <link rel="apple-touch-icon" href={appleTouchIcon180x180.src}/>
            <meta name="viewport"
                  content="height=device-height,width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
            <meta name="apple-mobile-web-app-title" content={messages.iosHomeScreenTitle}/>
            <meta name="title" content={messages.siteTitle}/>
            <meta name="description" content={messages.orgDescription}/>
            <meta property="og:type" content="website"/>
            <meta property="og:url" content="https://capitolcityflyers.org/"/>
            <meta property="og:title" content={messages.siteTitle}/>
            <meta property="og:description" content={messages.orgDescription}/>
            <meta property="og:image" content="https://capitolcityflyers.org/static/assets/images/favicon.png"/>
            <meta property="twitter:card" content="summary_large_image"/>
            <meta property="twitter:url" content="https://capitolcityflyers.org/"/>
            <meta property="twitter:title" content={messages.siteTitle}/>
            <meta property="twitter:description" content={messages.orgDescription}/>
            <meta property="twitter:image" content="https://capitolcityflyers.org/static/assets/images/favicon.png"/>
            {/* TODO: google analytics */}
        </Head>
    );
}
