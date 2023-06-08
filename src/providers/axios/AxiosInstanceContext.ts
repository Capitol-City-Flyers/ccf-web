import {createContext, useContext, useMemo} from "react";
import {AxiosInstance, CreateAxiosDefaults} from "axios";
import _ from "lodash";
import {useApp} from "../app/AppContext";

/**
 * Contents of the Axios context, which provides helpers for creating Axios instances with standard configuration and
 * interceptors attached.
 */
export interface AxiosInstanceContext {
    create(config: CreateAxiosDefaults): AxiosInstance;
}

/**
 * Context in which {@link AxiosInstanceContext} is exposed for access via the {@link useAxiosInstance} hook.
 */
export const axiosInstanceContext = createContext<AxiosInstanceContext | null>(null);

/**
 * Get an Axios instance with standard configuration and interceptors attached. The returned instance will have the
 * following characteristics:
 *
 * * Requests will be tracked in {@link AppState.status.tasks}.
 * * Any provided {@link CreateAxiosDefaults.baseURL} will be resolved relative to the environment base URL *if not in
 *   the `_build` environment.*
 *
 * @param config the request configuration.
 */
export function useAxiosInstance(config?: CreateAxiosDefaults) {
    const context = useContext(axiosInstanceContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    const {env} = useApp();
    return useMemo(() => {
        const overrides: Partial<CreateAxiosDefaults> = {};
        if (!("baseURL" in config)) {
            if ("_build" !== env) {
                overrides.baseURL = env.href;
            }
        } else {
            const {baseURL} = config;
            if ("_build" === env) {
                overrides.baseURL = baseURL;
            } else {
                overrides.baseURL = new URL(baseURL, env).href;
            }
        }
        return context.create(_.assign({}, config, overrides));
    }, [config]);
}
