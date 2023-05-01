import {freeze} from "immer";
import _, {Dictionary} from "lodash";

/**
 * Object which can resolve messages in the localization bundle.
 */
export interface MessageResolver {
    resolve(message: MessageSpec): string;

    resolve(message: MessageRef, ...params: Array<any>): string;
}

/**
 * Reference to a message: either a key in the application message bundle or a literal message string.
 */
export type MessageRef = MessageKey | MessageLiteral;

/**
 * Function which returns a message (or message format string) from the localization bundle.
 */
export type MessageSource = (key: string) => string | undefined;

/**
 * Reference to a message, optionally wrapped with a substitution array or function producing a substitution array.
 */
export type MessageSpec = MessageRef | MessageResolvable;

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
        }, new Array<string>(""))
        .reverse();
}

/**
 * Given a dictionary of locales to dictionaries of messages in the localization bundle, assemble a flat dictionary of
 * message keys to values for all locales in a given lookup list. The locale lookup list should be ordered from *most*
 * to *least* specific, and should end with `""` for the default locale. For example, a typical lookup list would be
 * `["en-US", "en", ""]`.
 *
 * @param messagesByLocale the dictionary of messages, keyed by locale.
 * @param locales the locale lookup list.
 */
export function resolveBundle(messagesByLocale: Dictionary<Dictionary<string>>, locales: Array<string>) {
    return _.transform<string, Dictionary<string>>(locales, (acc, locale) =>
        _.defaults(acc, messagesByLocale[locale]), {});
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
    const paramValues = _.isFunction(actualParams) ? actualParams() : actualParams || [];
    return format.replace(messageFormatToken, (substring, indexString) => {
        const index = parseInt(indexString);
        if (index >= paramValues.length) {
            throw Error(`No argument for parameter [${index}] in format [${format}].`);
        }
        return paramValues[index];
    });
}

/**
 * Literal (non-localized) message string.
 */
type MessageLiteral = `&${string}`;

/**
 * Key in the application message bundle.
 */
export type MessageKey = Exclude<string, `&${string}`>;

/**
 * Message reference and optional substitution parameters.
 */
interface MessageResolvable {
    message: MessageRef;
    params?: Array<any> | (() => Array<any>);
}

/**
 * Type guard to determine whether a value is a {@link MessageKey}.
 *
 * @param value the value to check.
 */
function isMessageKey(value: any): value is MessageKey {
    return "string" === typeof value
        || !isMessageLiteral(value);
}

/**
 * Type guard to determine whether a value is a {@link MessageLiteral}.
 *
 * @param value
 */
function isMessageLiteral(value: any): value is MessageLiteral {
    return "string" === typeof value
        && 0 === value.indexOf("&");
}

/**
 * Type guard to determine whether a value is a {@link MessageResolvable}.
 *
 * @param value the value to check.
 */
function isMessageResolvable(value: any): value is MessageResolvable {
    return "object" === typeof value
        && "message" in value
        && (
            isMessageKey(value.message)
            || isMessageLiteral(value.message));
}

/**
 * Regex used to parse (simple) Java `MessageFormat`-style token references from a message string.
 */
const messageFormatToken = freeze(/{(0|([1-9][0-9]*))}/g);