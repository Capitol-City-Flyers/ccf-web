import {PropsWithChildren, useEffect, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import {useAppState, useConfig} from "../app/AppContext";
import {MessagesContext, messagesContext} from "./MessagesContext";
import {localeLookupList, resolveMessage} from "./messages-utils";

import messagesJson from "../../messages.json";

/**
 * [MessagesProvider] resolves locale specific message bundles and exposes them for access via the [useMessages] hook.
 *
 * @param children the child element(s).
 * @constructor
 */
export default function MessagesProvider({children}: PropsWithChildren) {
    const {prefs: {ui: {languages: preferredLanguages}}} = useAppState(),
        {defaults: {prefs: {ui: {languages: defaultLanguages}}}} = useConfig(),
        context = useMemo<MessagesContext>(() => {
            const languages = [...preferredLanguages];
            let language = preferredLanguages.find(language => !!messagesJson[language]);
            if (null == language) {
                languages.push(...defaultLanguages);
                language = defaultLanguages[0];
            }
            const bundleLanguages = localeLookupList(language),
                bundle = _.defaults({}, ...bundleLanguages.map(locale => messagesJson[locale] || {}));
            return freeze({
                resolver: {
                    resolve: _.partial(resolveMessage, key => bundle[key])
                },
                bundle, languages
            });
        }, [defaultLanguages, preferredLanguages, messagesJson]);
    const {languages: [language]} = context;
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
