import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {produce} from "immer";
import {useApp} from "../../../providers/app/AppContext";
import {useMessages} from "../../../providers/messages/MessagesContext";
import {useNominatimClient} from "../../../integrations/nominatim/NominatimContext";

export default function Preferences() {
    const messages = useMessages({
            enableGeolocationLabel: "cin.label.preference.enable-geolocation",
            installLabel: "cin.label.preference.install"
        }),
        {dispatch, state} = useApp(),
        {prefs: {device}, status: {position}} = state,
        {current: initialState} = useRef(device),
        [form, updateForm] = useState(initialState),
        nominatim = useNominatimClient(),
        [place, setPlace] = useState<string>();

    useEffect(() => {
        if (null == position) {
            setPlace(null);
        } else {
            nominatim.retrievePlace(position).then(setPlace);
        }
    }, [position]);

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
                    <input name="enableGeolocation"
                           checked={form.enableGeolocation}
                           type="checkbox"
                           onChange={onCheckboxChange}/>&nbsp;{messages.enableGeolocationLabel}
                </label> {place && `- ${place}`} {position && (
                <span>({position.latitude}, {position.longitude})</span>)}
            </div>
            <div>
                <label>
                    <input name="install"
                           checked={form.install}
                           type="checkbox"
                           onChange={onCheckboxChange}/>&nbsp;{messages.installLabel}
                </label>
            </div>
        </main>
    );
}
