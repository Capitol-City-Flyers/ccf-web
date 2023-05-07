import {freeze} from "immer";
import _ from "lodash";

/**
 * Configuration for a {@link TextTokenizer} instance.
 */
interface TextTokenizerConfig {
    includeNewline?: boolean;
    includeWhitespace?: boolean;
}

/**
 * Token representing a run of *non-newline* whitespace.
 */
export interface WhitespaceToken {
    kind: "whitespace";
}

/**
 * Token representing a single newline, which may be `\n` or an `\r\n` pair.
 */
export interface NewlineToken {
    kind: "newline";
}

/**
 * Token representing a run of non-whitespace text.
 */
export interface TextToken {
    kind: "text";
    value: string;
}

/**
 * Token types emitted by {@link TextTokenizer.next()}.
 */
export type Token =
    | NewlineToken
    | TextToken
    | WhitespaceToken;

/**
 * {@link TextTokenizer} is a simple tokenizer which splits an input string on whitespace, optionally including tokens
 * corresponding to any whitespace encountered. If {@link TextTokenizerConfig.includeNewline} is `true`, produces a
 * {@link NewlineToken} for each *individual* newline encountered. If {@link TextTokenizerConfig.includeWhitespace} is
 * `true`, produces a {@link WhitespaceToken} for each *run* of (non-newline) whitespace encountered.
 *
 * Defaults to *not* including tokens for newlines or whitespace; both are opt-in via configuration.
 */
export class TextTokenizer {
    private readonly matcher = new RegExp(TextTokenizer.SPLIT);
    private readonly queued = new Array<Token>();
    private complete = false;
    private readonly config: TextTokenizerConfig;

    constructor(
        private readonly text: string,
        config: TextTokenizerConfig = TextTokenizer.DEFAULT_CONFIG
    ) {
        this.config = _.defaults({}, config, TextTokenizer.DEFAULT_CONFIG);
    }

    /**
     * Get an iterator over the remaining (not yet seen) tokens.
     */
    [Symbol.iterator] = () => ({
        next: (): IteratorResult<Token> => {
            const value = this.next();
            if (null == value) {
                return {done: true, value};
            }
            return {done: false, value};
        }
    });

    /**
     * Get an iterator function over the remaining (not yet seen) tokens.
     */
    iterator() {
        return _.bind(TextTokenizer.prototype.next, this);
    }

    next(): Token | undefined {
        if (!this.complete) {
            const {queued} = this;
            if (!_.isEmpty(queued)) {
                return queued.shift();
            }

            /* Match until we find the next returnable token. */
            const {matcher, text} = this;
            do {
                const {lastIndex} = matcher,
                    match = matcher.exec(text);
                if (null == match) {
                    this.complete = true;
                    if (lastIndex < text.length) {

                        /* Enqueue final text token. */
                        queued.push({kind: "text", value: text.substring(lastIndex)});
                    }
                } else {

                    /* Enqueue next text token. */
                    const {[0]: matched, [1]: newline, index} = match,
                        {config: {includeNewline, includeWhitespace}} = this;
                    if (index > lastIndex) {
                        queued.push({kind: "text", value: text.substring(lastIndex, index)});
                    }

                    /* Enqueue newline or whitespace if applicable. */
                    if (null != newline) {
                        if (includeNewline) {
                            queued.push({kind: "newline"});
                        }
                    } else if (includeWhitespace) {
                        queued.push({kind: "whitespace"});
                    }
                }
            } while (0 === queued.length && !this.complete);

            /* Return the next token. */
            if (queued.length > 0) {
                return queued.shift();
            }
        }
    }

    /**
     * Token split pattern. Matches a single newline or a run of non-newline whitespace.
     */
    static SPLIT = /(\r?\n)|[ \t]+/g;

    /**
     * Default configuration: do not emit tokens for whitespace.
     */
    static DEFAULT_CONFIG = freeze<TextTokenizerConfig>({
        includeNewline: false,
        includeWhitespace: false
    });
}

/**
 * Type guard for {@link TextToken}.
 *
 * @param value the value to check.
 */
export function isTextToken(value: any): value is TextToken {
    return _.isObject(value) && "kind" in value && "text" === value["kind"];
}

/**
 * Type guard for {@link NewlineToken}.
 *
 * @param value the value to check.
 */
export function isNewlineToken(value: any): value is NewlineToken {
    return _.isObject(value) && "kind" in value && "newline" === value["kind"];
}
