import {useApp, useConfig} from "../../../providers/app/AppContext";
import {useEffect, useMemo} from "react";
import {useAxiosInstance} from "../../../providers/axios/AxiosInstanceContext";
import {AxiosHeaders, CreateAxiosDefaults} from "axios";
import {validateIn} from "../../../utilities/array-utils";
import {NFDCClient} from "./NFDCClient";
import {SystemZone} from "luxon";
import {DateCalc} from "../../../utilities/DateCalc";
import {freeze} from "immer";

export default function NFDCSynchronizer() {
    const {integration: {faa: {nfdc}}} = useConfig(),
        {state: {prefs: {device: {install}}, status: {online}}} = useApp(),
        axiosConfig = useMemo<CreateAxiosDefaults>(() => freeze({
            baseURL: nfdc.baseURL.href,
            headers: new AxiosHeaders().setAccept("application/zip"),
            responseType: "arraybuffer",
            validateStatus: validateIn(200)
        }), [nfdc.baseURL]),
        axios = useAxiosInstance(axiosConfig),
        zone = SystemZone.instance,
        client = useMemo(() => NFDCClient.create(axios, DateCalc.create(zone)), [axios, zone]);

    useEffect(() => {
        if (!install) {

        } else if (online) {
            client.getWeatherStations().then(stations => {
                console.log(`Retrieved ${stations.length} weather stations.`, stations);
                client.getAirports().then(airports => {
                    console.log(`Retrieved ${airports.length} airports.`, airports);
                });
            });
        }
    }, [install, online]);
    return null;
}
