import {useMemo} from "react";
import {freeze} from "immer";
import _, {Dictionary} from "lodash";
import {localeLookupList, MessageResolver, MessageSpec, resolveBundle, resolveMessage} from "../utils/MessageUtils";
import {useAppContext} from "./AppContext";

/**
 * Hook to retrieve the {@link MessageResolver} with zero or more pre-resolved messages.
 *
 * @param spec the specification declaring the messages to be pre-resolved.
 */
export function useMessages<S extends Dictionary<MessageSpec>>(spec?: S): MessageResolver & { [K in keyof S]: string } {
    const {app: {prefs: {locale}}, messagesByLocale} = useAppContext(),
        resolver = useMemo<MessageResolver>(() => {
            const bundle = resolveBundle(messagesByLocale, localeLookupList(locale));
            return freeze({
                resolve: _.partial(resolveMessage, key => bundle[key])
            }, true);
        }, [locale, messagesByLocale]);
    return useMemo(() => decorateResolver(resolver, spec), [resolver, JSON.stringify(spec)]);
}

/**
 * Create a {@link MessageResolver} which delegates to a provided resolver and includes properties for each message
 * defined in a message specification object. Extracted from {@link useMessages} primarily for testability.
 *
 * @param resolver the message resolver.
 * @param spec the specification declaring the messages to be pre-resolved.
 */
export function decorateResolver<S extends Dictionary<MessageSpec>>(
    resolver: MessageResolver,
    spec?: S
): MessageResolver & { [K in keyof S]: string } {
    const resolved = spec && _.mapValues(_.clone(spec), message => resolver.resolve(message));
    return freeze(_.assign({}, resolver, resolved));
}
