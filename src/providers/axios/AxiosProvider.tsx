import {PropsWithChildren, useMemo} from "react";
import Axios from "axios";
import {freeze} from "immer";
import {useAppDispatch} from "../app/AppContext";
import {AxiosDecorator} from "./AxiosDecorator";
import {axiosInstanceContext, useAxiosInstance} from "./AxiosInstanceContext";
import type {AxiosInstanceContext} from "./AxiosInstanceContext";

/**
 * {@link AxiosProvider} exposes the {@link AxiosInstanceContext} for access via the {@link useAxiosInstance} hook.
 *
 * @param props the component properties.
 * @constructor
 */
export default function AxiosProvider(props: PropsWithChildren) {
    const {children} = props,
        dispatch = useAppDispatch(),
        decorator = useMemo(() => AxiosDecorator.create(dispatch), [dispatch]),
        context = useMemo<AxiosInstanceContext>(() => freeze({
            create: config => decorator.decorate(Axios.create(config))
        }), [decorator]);
    return (
        <axiosInstanceContext.Provider value={context}>
            {children}
        </axiosInstanceContext.Provider>
    );
}
