import {PropsWithChildren, useMemo} from "react";
import {AxiosHeaders, type CreateAxiosDefaults} from "axios";
import {freeze} from "immer";
import {useApp} from "../../providers/app/AppContext";
import {useAxiosInstance} from "../../providers/axios/AxiosInstanceContext";
import {validateIn} from "../../utilities/array-utils";
import {NominatimClient} from "./NominatimClient";
import {type NominatimContext, nominatimContext} from "./NominatimContext";

/**
 * {@link NominatimProvider} provides the {@link NominatimContext} for access via the {@link useNominatimClient} hook,
 * which provides reverse geolocation services.
 *
 * @param props the component properties.
 * @constructor
 */
export default function NominatimProvider(props: PropsWithChildren) {
    const {children} = props,
        {config: {integration: {nominatim: {baseURL}}}, env} = useApp(),
        axiosConfig = useMemo<CreateAxiosDefaults>(() => freeze({
            baseURL: baseURL.href,
            headers: new AxiosHeaders().setAccept("application/json"),
            params: {
                format: "json"
            },
            validateStatus: validateIn(200)
        }, true), [baseURL]),
        axios = useAxiosInstance(axiosConfig),
        context = useMemo<NominatimContext>(() => freeze({client: NominatimClient.create(axios)}, true), [axios]);
    return (
        <nominatimContext.Provider value={context}>
            {children}
        </nominatimContext.Provider>
    );
}
