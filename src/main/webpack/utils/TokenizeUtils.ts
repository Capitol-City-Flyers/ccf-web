import {freeze} from "immer";
import _ from "lodash";

/**
 * Tokenization options for {@link tokenize}.
 */
interface TokenizeOptions {
    emitEnd: boolean;
    emitNewline: boolean;
    emitWhitespace: boolean;
}

/**
 * Windowing options for {@link windowed}
 */
interface WindowedOptions {
    lookAhead: number;
    lookBehind: number;
}

/**
 * Token types emitted by {@link tokenize}.
 */
export type Token =
    | typeof END
    | typeof NEWLINE
    | typeof WHITESPACE
    | Text;

/**
 * Window of elements from an iterable.
 */
export interface Windowed<T> {
    ahead: Array<T>;
    behind: Array<T>;
    current: T;
    next?: T;
    previous?: T;
}

/**
 * Tokenize a string into whitespace and/or newline-delimited blocks of text, optionally emitting tokens representing
 * chunks of whitespace, individual newlines, and/or the end of the input string.
 *
 * @param text the text to tokenize.
 * @param options the tokenization options.
 */
export function* tokenize(text: string, options: Partial<TokenizeOptions> = DEFAULT_TOKENIZE_OPTIONS): Generator<Token> {
    const {emitEnd, emitNewline, emitWhitespace} = _.defaults({}, options, DEFAULT_TOKENIZE_OPTIONS),
        splitter = /(\r?\n)|[ \t]+/g;
    do {
        const {lastIndex} = splitter,
            match = splitter.exec(text);
        if (null == match) {

            /* Yield a token for any remaining text, then finish. */
            if (lastIndex < text.length) {
                yield {kind: "text", value: text.substring(lastIndex)};
            }
            break;
        }

        /* Enqueue next text token. */
        const {[0]: matched, [1]: newline, index} = match;
        if (index > lastIndex) {
            yield {kind: "text", value: text.substring(lastIndex, index)};
        }

        /* Enqueue newline or whitespace if applicable. */
        if (null != newline) {
            if (emitNewline) {
                yield NEWLINE;
            }
        } else if (emitWhitespace) {
            yield WHITESPACE;
        }
    } while (true);
    if (emitEnd) {
        yield END;
    }
}

/**
 * Window an iterable sequence of values, combining each with its predecessors and successors.
 *
 * @param elements the elements to window.
 * @param options the windowing options.
 */
export function* windowed<T>(elements: Iterable<T>, options: Partial<WindowedOptions> = DEFAULT_SCAN_OPTIONS): Generator<Windowed<T>> {
    const {lookAhead, lookBehind} = _.defaults({}, options, DEFAULT_SCAN_OPTIONS),
        ahead = new Array<T>(),
        behind = new Array<T>();
    for (let next of elements) {
        ahead.push(next);
        if (ahead.length > lookAhead) {
            const current = ahead.shift()!;
            yield createWindowed(current, ahead, behind);
            behind.unshift(current);
            if (behind.length > lookBehind) {
                behind.pop();
            }
        }
    }
    let current: T | undefined;
    while (current = ahead.shift()) {
        yield createWindowed(current, ahead, behind);
        behind.unshift(current);
        behind.pop();
    }
}

function createWindowed<T>(current: T, ahead: Array<T>, behind: Array<T>): Windowed<T> {
    return _.assign({
        ahead: ahead.slice(),
        behind: behind.slice(),
        current
    }, !_.isEmpty(ahead) && {
        next: ahead[0]
    }, !_.isEmpty(behind) && {
        previous: behind[0]
    });
}

/**
 * Token representing a run of non-whitespace text.
 */
interface Text {
    kind: "text";
    value: string;
}

/**
 * Token representing the end of the input text.
 */
const END = freeze({
    kind: "end"
} as const);

/**
 * Token representing a single newline character (`\n` or `\r\n`.)
 */
const NEWLINE = freeze({
    kind: "newline"
} as const);

/**
 * Token representing a run of non-newline whitespace.
 */
const WHITESPACE = freeze({
    kind: "whitespace"
} as const);

/**
 * Default options for {@link window}.
 */
const DEFAULT_SCAN_OPTIONS = freeze<WindowedOptions>({
    lookAhead: 3,
    lookBehind: 1
});

/**
 * Default options for {@link tokenize()}.
 */
const DEFAULT_TOKENIZE_OPTIONS = freeze<TokenizeOptions>({
    emitEnd: false,
    emitNewline: false,
    emitWhitespace: false
});

/**
 * Type guard for {@link Text}.
 *
 * @param value the value to check.
 */
export function isTextToken(value: any): value is Text {
    return _.isObject(value) && "kind" in value && "text" === value["kind"];
}

/**
 * Type guard for {@link NEWLINE}.
 *
 * @param value the value to check.
 */
export function isNewlineToken(value: any): value is typeof NEWLINE {
    return _.isObject(value) && "kind" in value && NEWLINE.kind === value["kind"];
}
