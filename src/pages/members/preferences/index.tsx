import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {produce} from "immer";
import {useApp} from "../../../providers/app/AppContext";
import {useMessages} from "../../../providers/messages/MessagesContext";

export default function Preferences() {
    const messages = useMessages({
            enableExperimentalFeaturesLabel: "cin.label.preference.enable-experimental-features",
            enableGeolocationLabel: "cin.label.preference.enable-geolocation",
            installLabel: "cin.label.preference.install"
        }),
        {dispatch, state} = useApp(),
        {prefs: {device}, status: {client: {build}}} = state,
        {current: initialState} = useRef(device),
        [form, updateForm] = useState(initialState);

    /* Handle change of checkbox inputs. */
    const onCheckboxChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
        const {target: {checked, name}} = ev;
        updateForm(previous => produce(previous, draft => {
            draft[name] = checked;
        }));
    }, [updateForm]);

    /* Update preferences when form state changes. */
    useEffect(() => {
        dispatch({
            kind: "devicePrefsChanged",
            payload: form
        });
    }, [dispatch, form]);
    return (
        <main>
            <div>
                <label>
                    <input name="enableExperimentalFeatures"
                           checked={form.enableExperimentalFeatures}
                           type="checkbox"
                           onChange={onCheckboxChange}/>&nbsp;{messages.enableExperimentalFeaturesLabel}
                </label>
            </div>
            <div>
                <label>
                    <input name="enableGeolocation"
                           checked={form.enableGeolocation}
                           type="checkbox"
                           onChange={onCheckboxChange}/>&nbsp;{messages.enableGeolocationLabel}
                </label>
            </div>
            <div>
                <label>
                    <input name="install"
                           checked={form.install}
                           type="checkbox"
                           onChange={onCheckboxChange}/>&nbsp;{messages.installLabel}
                </label>
            </div>
            {build && (
                <>
                    {build.version && (
                        <div>
                            Version: <em>{build.version}</em>
                        </div>
                    )}
                    <div>
                        Built: <em>{build.timestamp.setZone("local").toLocaleString({dateStyle: "medium", timeStyle: "long"})} ({build.id})</em>
                    </div>
                </>
            )}
        </main>
    );
}
