import {createContext, useContext, useMemo} from "react";
import {freeze} from "immer";
import {MessageResolver, MessageSpec} from "./messages-types";
import {decorateResolver} from "./messages-utils";

/**
 * Object held in the messages context.
 */
export interface MessagesContext {
    resolver: MessageResolver;
    bundle: Record<string, string>;
}

/**
 * Context in which the current message bundle and message resolver are exposed.
 */
export const messagesContext = createContext<MessagesContext | null>(null);

/**
 * Hook to retrieve the {@link MessageResolver} with zero or more pre-resolved messages.
 *
 * @param spec the specification declaring the messages to be pre-resolved.
 */
export function useMessages<S extends Record<string, MessageSpec>>(spec?: S): MessageResolver & { [K in keyof S]: string } {
    const context = useContext(messagesContext);
    if (null == context) {
        throw Error("Context is empty.");
    }
    const {resolver} = context!;
    return useMemo(() => freeze(decorateResolver(resolver, spec)), [resolver, JSON.stringify(spec)]);
}
