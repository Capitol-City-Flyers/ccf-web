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
 * Key in the application message bundle.
 */
export type MessageKey = Exclude<string, `&${string}`>;

/**
 * Type guard to determine whether a value is a {@link MessageKey}.
 *
 * @param value the value to check.
 */
export function isMessageKey(value: any): value is MessageKey {
    return "string" === typeof value
        || !isMessageLiteral(value);
}

/**
 * Type guard to determine whether a value is a {@link MessageLiteral}.
 *
 * @param value
 */
export function isMessageLiteral(value: any): value is MessageLiteral {
    return "string" === typeof value
        && 0 === value.indexOf("&");
}

/**
 * Type guard to determine whether a value is a {@link MessageResolvable}.
 *
 * @param value the value to check.
 */
export function isMessageResolvable(value: any): value is MessageResolvable {
    return "object" === typeof value
        && "message" in value
        && (
            isMessageKey(value.message)
            || isMessageLiteral(value.message));
}

/**
 * Literal (non-localized) message string.
 */
type MessageLiteral = `&${string}`;

/**
 * Message reference and optional substitution parameters.
 */
interface MessageResolvable {
    message: MessageRef;
    params?: Array<any> | (() => Array<any>);
}
