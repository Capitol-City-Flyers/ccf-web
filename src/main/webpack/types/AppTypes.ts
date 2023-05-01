/**
 * App configuration which does not change within a deployment.
 */
export interface AppConfig {
    baseUrl: URL;

    /**
     * Flag indicating whether the app is running in standalone mode (full screen, installed on a device.)
     */
    standalone: boolean;
}

/**
 * Portion of the {@link AppConfig} which is received directly from the server in the JSON-encoded content of the
 * `<div id="ccf-config"/>` element in the `index.html.ftlh` template.
 */
export type ClientConfig = Omit<AppConfig, "baseUrl" | "standalone">;
