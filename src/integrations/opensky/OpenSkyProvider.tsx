import {PropsWithChildren, useMemo} from "react";
import {AxiosHeaders, type CreateAxiosDefaults} from "axios";
import {freeze} from "immer";
import {useApp} from "../../providers/app/AppContext";
import {useAxiosInstance} from "../../providers/axios/AxiosInstanceContext";
import {validateIn} from "../../utilities/array-utils";
import {OpenSkyClient} from "./OpenSkyClient";
import {type OpenSkyContext, openSkyContext} from "./OpenSkyContext";

/**
 * {@link OpenSkyProvider} provides the {@link OpenSkyContext} for access via the {@link useOpenSkyClient} hook,
 * which provides flight tracking and aircraft location services.
 *
 * @param props the component properties.
 * @constructor
 */
export default function OpenSkyProvider(props: PropsWithChildren) {
    const {children} = props,
        {config: {integration: {openSky: {baseURL}}}, env} = useApp(),
        axiosConfig = useMemo<CreateAxiosDefaults>(() => freeze({
            baseURL: baseURL.href,
            headers: new AxiosHeaders().setAccept("application/json"),
            responseType: "json",
            validateStatus: validateIn(200, 429)
        }, true), [baseURL]),
        axios = useAxiosInstance(axiosConfig),
        context = useMemo<OpenSkyContext>(() => freeze({client: OpenSkyClient.create(axios)}, true), [axios]);
    return (
        <openSkyContext.Provider value={context}>
            {children}
        </openSkyContext.Provider>
    );
}
