import React from "react";
import {createRoot} from "react-dom/client";
import {freeze} from "immer";
import {AppConfig, ClientConfig} from "./types/AppTypes";
import {CcfApp} from "./CcfApp";

/* Import the combined message bundle. */
import messages from "../../../build/generated/resources/messages/META-INF/resources/static/messages.json";

/* Import PostCSS-processed global styles. Note that /assets/css/*.css styles are not processed. */
import "./styles/global.css";

/* Import messages and assets referenced in index.html.ftlh template to ensure they are added to the manifest. */
import "./assets/images/apple-touch-icon-180x180.png";
import "./assets/images/favicon.png";
import "./assets/styles/fontawesome.min.css";
import "./assets/styles/brands.min.css";
import "./assets/styles/solid.min.css";
import "./assets/webfonts/fa-brands-400.ttf";
import "./assets/webfonts/fa-brands-400.woff2";
import "./assets/webfonts/fa-solid-900.ttf";
import "./assets/webfonts/fa-solid-900.woff2";
import _ from "lodash";

function parseHtmlEscapedJson<T>(document: Document, escapedJson: string) {
    const div = document.createElement("div");
    div.innerHTML = escapedJson;
    return JSON.parse(div.textContent as string) as T;
}

function checkStandalone(window: Window) {
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

/* Application entry point. */
((window: Window) => {
    const {document} = window,
        standalone = checkStandalone(window),
        configElement = document.getElementById("ccf-config") as HTMLScriptElement,
        {textContent: escapedConfigJson} = configElement,
        clientConfig = parseHtmlEscapedJson<ClientConfig>(document, escapedConfigJson!),
        {baseURI} = document,
        config = freeze<AppConfig>({
            ...clientConfig,
            baseUrl: new URL(baseURI),
            standalone
        }, true),
        appElement = document.getElementById("ccf-app") as HTMLDivElement,
        root = createRoot(appElement);
    if (standalone) {
        appElement.classList.add("ccf-standalone");
    }
    root.render(<CcfApp config={config} messagesByLocale={_.toPlainObject(messages)} window={window}/>);
})(window);
