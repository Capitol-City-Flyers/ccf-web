import {Dispatch} from "react";
import Axios, {
    AxiosInstance,
    AxiosProgressEvent,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    Method,
    isAxiosError,
    isCancel
} from "axios";
import _ from "lodash";
import {freeze} from "immer";
import {AppStateAction, TaskId} from "../app/app-types";

/**
 * {@link AxiosDecorator} keeps track of active HTTP requests and dispatches status updates to the application task
 * list.
 */
export class AxiosDecorator {
    private readonly taskIdsByRequest = new Map<AxiosRequestConfig, TaskId>();
    private readonly interceptRequest: Parameters<typeof Axios["interceptors"]["request"]["use"]>[0];
    private readonly interceptResponse: Parameters<typeof Axios["interceptors"]["response"]["use"]>[0];
    private readonly interceptError: Parameters<typeof Axios["interceptors"]["response"]["use"]>[1];

    private constructor(private dispatch: Dispatch<AppStateAction>) {
        this.interceptRequest = _.bind(AxiosDecorator.prototype.doInterceptRequest, this);
        this.interceptResponse = _.bind(AxiosDecorator.prototype.doInterceptResponse, this);
        this.interceptError = _.bind(AxiosDecorator.prototype.doInterceptResponseError, this);
    }

    /**
     * Apply standard interceptors to an Axios instance.
     *
     * @param axios the Axios instance.
     */
    decorate(axios: AxiosInstance) {
        const {interceptors: {request, response}} = axios;
        request.use(this.interceptRequest);
        response.use(this.interceptResponse, this.interceptError);
        return axios;
    }

    private doInterceptRequest(request: InternalAxiosRequestConfig<any>) {

        /* Assign a task identifier and add to the task status list. */
        const {dispatch, taskIdsByRequest} = this,
            {baseURL, url} = request,
            taskId = `axios.request.${_.uniqueId()}`;
        taskIdsByRequest.set(request, taskId);
        dispatch({
            kind: "taskStarted",
            payload: {
                kind: "httpRequest",
                id: taskId,
                url: null == baseURL ? new URL(url) : new URL(url, new URL(baseURL)),
                method: request.method.toLowerCase() as Lowercase<Method>,
                status: {
                    phase: "request",
                    progress: 0,
                    received: 0,
                    sent: 0
                }
            }
        });

        /* Intercept progress events. */
        const {onDownloadProgress, onUploadProgress} = request;
        request.onDownloadProgress = ev => {
            this.onRequestProgress(taskId, ev);
            if (null != onDownloadProgress) {
                onDownloadProgress(ev);
            }
        };
        request.onUploadProgress = ev => {
            this.onRequestProgress(taskId, ev);
            if (null != onUploadProgress) {
                onUploadProgress(ev);
            }
        };
        return request;
    }

    private doInterceptResponse(response: AxiosResponse<any, any>) {
        const {dispatch, taskIdsByRequest} = this,
            {config} = response;
        dispatch({
            kind: "taskCompleted",
            payload: taskIdsByRequest.get(config)
        });
        taskIdsByRequest.delete(config)
        return response;
    }

    private doInterceptResponseError(error: any) {
        const {dispatch, taskIdsByRequest} = this;
        if (isCancel(error)) {

            /* Don't have the request in the cancel case; delete *all* canceled requests. */
            _.forEach(taskIdsByRequest.entries(), ([request, taskId]) => {
                if (!!request.cancelToken) {
                    dispatch({
                        kind: "taskCompleted",
                        payload: taskId
                    });
                    taskIdsByRequest.delete(request);
                }
            });
        } else if (isAxiosError(error)) {
            dispatch({
                kind: "taskCompleted",
                payload: taskIdsByRequest.get(error.config)
            });
            taskIdsByRequest.delete(error.config);
        }
        console.error("Unexpected error in Axios request.", error);
        return error;
    }

    private onRequestProgress(taskId: TaskId, ev: AxiosProgressEvent) {
        this.dispatch({
            kind: "taskUpdated",
            payload: {
                id: taskId,
                status: {
                    [ev.upload ? "sent" : "received"]: ev.loaded,
                    progress: ev.progress,
                    total: ev.total
                }
            }
        });
    }

    static create(dispatch: Dispatch<AppStateAction>) {
        return freeze(new AxiosDecorator(dispatch));
    }
}
