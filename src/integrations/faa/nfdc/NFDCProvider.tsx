import {type PropsWithChildren, useMemo} from "react";
import {type CreateAxiosDefaults, AxiosHeaders} from "axios";
import {freeze} from "immer";
import {ProviderComponentProps} from "../../../providers/app/app-types";
import {useAxiosInstance} from "../../../providers/axios/AxiosInstanceContext";
import {useDatabase} from "../../../providers/database/DatabaseContext";
import {validateIn} from "../../../utilities/array-utils";
import NASRSync from "./NASRSync";
import {NFDCClient} from "./NFDCClient";

/**
 * {@link NFDCProvider} creates an {@link NFDCClient} for accessing the FAA NFDC datasets and configures synchronization
 * to the local database.
 *
 * @param props the component properties.
 * @constructor
 */
export default function NFDCProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, config: {integration: {faa: {nfdc: {baseURL}}}}} = props,
        axiosConfig = useMemo<CreateAxiosDefaults>(() => freeze({
            baseURL: baseURL.href,
            headers: new AxiosHeaders().setAccept("application/zip"),
            responseType: "arraybuffer",
            validateStatus: validateIn(200)
        }, true), [baseURL]),
        axios = useAxiosInstance(axiosConfig),
        client = useMemo(() => NFDCClient.create(axios), [axios]),
        db = useDatabase();
    return (
        <>
            <NASRSync client={client} db={db}/>
            {children}
        </>
    );
}
