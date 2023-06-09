import {createContext, useContext} from "react";
import {OpenSkyClient} from "./OpenSkyClient";

export interface OpenSkyContext {
    client: OpenSkyClient;
}

export const openSkyContext = createContext<OpenSkyContext | null>(null);

export function useOpenSkyClient() {
    const context = useContext(openSkyContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context!.client;
}
