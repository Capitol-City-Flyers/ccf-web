import {useEffect, useMemo, useState} from "react";
import {AxiosHeaders, CreateAxiosDefaults} from "axios";
import _ from "lodash";
import {freeze} from "immer";
import {useApp, useConfig} from "../../../providers/app/AppContext";
import {useAxiosInstance} from "../../../providers/axios/AxiosInstanceContext";
import {validateIn} from "../../../utilities/array-utils";
import {isNFDCSync, NFDCSync} from "../../../providers/app/app-types";
import {nowUTC} from "../../../utilities/date-utils";
import {useDatabase} from "../../../providers/database/DatabaseContext";
import {NFDCClient} from "./NFDCClient";

export default function NFDCSynchronizer() {
    const {integration: {faa: {nfdc: config}}} = useConfig(),
        {dispatch, state: {prefs, status}} = useApp(),
        {device: {install}} = prefs,
        {online, sync} = status,
        axiosConfig = useMemo<CreateAxiosDefaults>(() => freeze({
            baseURL: config.baseURL.href,
            headers: new AxiosHeaders().setAccept("application/zip"),
            responseType: "arraybuffer",
            validateStatus: validateIn(200)
        }), [config.baseURL]),
        axios = useAxiosInstance(axiosConfig),
        client = useMemo(() => NFDCClient.create(axios), [axios]),
        initialState = useMemo<NFDCSync>(() => freeze(sync.find(isNFDCSync) || {
            kind: "nfdcSync",
            current: {
                cycle: client.currentCycle(nowUTC()).start.toISODate(),
                segments: []
            }
        }), [sync]),
        db = useDatabase(),
        [state, updateState] = useState(initialState);

    useEffect(() => {
        if (!install) {
            /* TODO: Delete everything. */
        } else if (online) {
            const {include} = config;
            [state.current, state.next].filter(sync => !!sync)
                .forEach(sync => {
                    if (_.includes(include, "airports") && !_.includes(sync.segments, "airports")) {
                        client.getAirports(sync.cycle)
                            .then(async airports => {
                                await db.airport.bulkPut(airports);
                                dispatch({
                                    kind: "nfdcSegmentCompleted",
                                    payload: {
                                        cycle: sync.cycle,
                                        segment: "airports"
                                    }
                                });
                            });
                    }
                    if (_.includes(include, "weatherStations") && !_.includes(sync.segments, "weatherStations")) {
                        client.getWeatherStations(sync.cycle)
                            .then(async weatherStations => {
                                await db.weatherStation.bulkPut(weatherStations);
                                dispatch({
                                    kind: "nfdcSegmentCompleted",
                                    payload: {
                                        cycle: sync.cycle,
                                        segment: "weatherStations"
                                    }
                                });
                            });
                    }
                });
        }
    }, [install, online, state.current, state.next]);
    return null;
}
