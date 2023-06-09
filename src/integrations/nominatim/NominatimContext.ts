import {NominatimClient} from "./NominatimClient";
import {createContext, useContext} from "react";

export interface NominatimContext {
    client: NominatimClient;
}

export const nominatimContext = createContext<NominatimContext | null>(null);

export function useNominatimClient() {
    const context = useContext(nominatimContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    return context!.client;
}
