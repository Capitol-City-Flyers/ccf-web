import {isMessageLiteral, isMessageResolvable, MessageResolver, MessageSource, MessageSpec} from "./messages-types";
import {freeze} from "immer";
import _ from "lodash";

/**
 * Create a {@link MessageResolver} which delegates to a provided resolver and includes properties for each message
 * defined in a message specification object. Extracted from {@link useMessages} primarily for testability.
 *
 * @param resolver the message resolver.
 * @param spec the specification declaring the messages to be pre-resolved.
 */
export function decorateResolver<S extends Record<string, MessageSpec>>(
    resolver: MessageResolver,
    spec?: S
): MessageResolver & { [K in keyof S]: string } {
    const resolved = spec && _.mapValues(_.clone(spec), message => resolver.resolve(message));
    return freeze(_.assign({}, resolver, resolved));
}

/**
 * Given a locale, break it into a locale lookup list in order from *most* specific to *least* specific, including the
 * default locale `""` at the end.
 *
 * @param locale the locale.
 */
export function localeLookupList(locale: string) {
    return _.transform(locale.split("-"),
        (acc, segment, index) => {
            if (segment) {
                if (0 === index) {
                    acc.push(segment);
                } else {
                    acc.push(`${acc[index]}-${segment}`);
                }
            }
        }, new Array<string>("_default"))
        .reverse();
}

/**
 * Resolve a message or message format string, optionally applying `{0},{1},...,{n}`-style substitutions.
 *
 * @param source the source of message or message format strings.
 * @param message the message to resolve and/or format.
 * @param params the substitution parameters to override any parameters in the message specification.
 */
export function resolveMessage(source: MessageSource, message: MessageSpec, ...params: Array<any>): string {
    const resolvable = isMessageResolvable(message) ? message : {params: [], message},
        actualParams = !_.isEmpty(params) ? params : resolvable.params,
        {message: keyOrLiteral} = resolvable,
        format = isMessageLiteral(keyOrLiteral)
            ? keyOrLiteral.replace(/^&/, "")
            : source(keyOrLiteral);
    if (null == format) {
        throw Error(`No message for key [${keyOrLiteral}].`);
    }
    if (-1 === format.indexOf("{")) {
        return format;
    }
    const paramValues = "function" === typeof (actualParams) ? actualParams() : actualParams || [];
    return format.replace(messageFormatToken, (substring, indexString) => {
        const index = parseInt(indexString);
        if (index >= paramValues.length) {
            throw Error(`No argument for parameter [${index}] in format [${format}].`);
        }

        /* Note: on the assumption that we would never want to format "null" or "undefined" into a user-facing string,
        any parameter that is nullish will be substituted with an empty string. */
        const value = paramValues[index];
        return null == value ? "" : value;
    });
}

/**
 * Regex used to parse (simple) Java `MessageFormat`-style token references from a message string.
 */
const messageFormatToken = freeze(/{(0|([1-9][0-9]*))}/g);
