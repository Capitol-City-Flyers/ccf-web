import _ from "lodash";
import {freeze} from "immer";
import {Token} from "./TextTokenizer";

interface TokenScannerConfig {
    lookBehindLimit: number;
}

export class TokenScanner<T> {
    private readonly ahead = new Array<T>();
    private readonly behind = new Array<T>();
    private readonly config: TokenScannerConfig;
    private current: T | undefined;
    private started = false;
    private iterator: Iterator<T>;

    constructor(
        iterable: Iterable<T>,
        config?: TokenScannerConfig
    ) {
        this.config = _.defaults({}, config, TokenScanner.DEFAULT_CONFIG);
        this.iterator = iterable[Symbol.iterator]();
    }

    [Symbol.iterator] = () => ({
        next: (): IteratorResult<T> => {
            const value = this.next();
            if (null == value) {
                return {done: true, value};
            }
            return {done: false, value};
        }
    });

    lookAhead(max: number = 1): Array<T> {
        if (max < 1) {
            return [];
        }
        const {ahead} = this,
            {length} = ahead;
        if (max == length) {
            return ahead;
        } else if (max < length) {
            return ahead.slice(0, max);
        }
        const {iterator} = this;
        let i = 0;
        for (let i = length; i < max; i += 1) {
            const next = iterator.next();
            if (!next.done) {
                ahead.push(next.value);
            }
        }
        return ahead;
    }

    lookBehind(max: number = 1): Array<T> {
        if (max < 1) {
            return [];
        }
        if (max > this.config.lookBehindLimit) {
            throw new Error("Insufficient look behind.");
        }
        return this.behind.slice(0, max);
    }

    next() {
        const {ahead} = this;
        let next: T | undefined;
        if (!_.isEmpty(ahead)) {
            next = ahead.shift();
        } else {
            next = this.iterator.next()?.value;
        }
        const {behind, current, config: {lookBehindLimit}} = this;
        if (null != current) {
            behind.unshift(current);
            if (behind.length > lookBehindLimit) {
                behind.pop();
            }
        }
        return this.current = next;
    }

    peek() {
        const ahead = this.lookAhead();
        if (1 === ahead.length) {
            return ahead[0];
        }
    }

    recall() {
        const behind = this.lookBehind();
        if (behind.length > 0) {
            return behind[0];
        }
    }

    static DEFAULT_CONFIG = freeze<TokenScannerConfig>({
        lookBehindLimit: 3
    });
}
