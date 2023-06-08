import {PropsWithChildren, useEffect, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import messagesJson from "../../../data/messages.json";
import {useAppState} from "../app/AppContext";
import {MessageResolver} from "./messages-types";
import {MessagesContext, messagesContext} from "./MessagesContext";
import {localeLookupList, resolveMessage} from "./messages-utils";

/**
 * [MessagesProvider] resolves locale specific message bundles and exposes them for access via the [useMessages] hook.
 *
 * @param children the child element(s).
 * @constructor
 */
export default function MessagesProvider({children}: PropsWithChildren) {
    const {prefs: {ui: {language}}} = useAppState(),
        context = useMemo<MessagesContext>(() => {
            const locales = localeLookupList(language),
                bundle = _.defaults({}, ...locales.map(locale => messagesJson[locale] || {})),
                resolver: MessageResolver = {
                    resolve: _.partial(resolveMessage, key => bundle[key])
                };
            return freeze({bundle, resolver});
        }, [language, messagesJson]);
    useEffect(() => {
        const {bundle} = context;
        console.debug(`Loaded [${Object.keys(bundle).length}] messages for language [${language}].`, _.sortBy(Object.entries(bundle), 0));
    }, [language, context]);
    return (
        <messagesContext.Provider value={context}>
            {children}
        </messagesContext.Provider>
    );
}
