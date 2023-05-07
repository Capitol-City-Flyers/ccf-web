import {isNewlineToken, isTextToken, TextToken, TextTokenizer, Token} from "../../utils/TextTokenizer";
import {TokenScanner} from "../../utils/TokenScanner";


export function parseTafCycle(cycle: string) {
    const tokenizer = new TextTokenizer(cycle, {includeNewline: true}),
        scanner = new TokenScanner(tokenizer),
        headers = new Array<string>();
    for (let current of scanner) {
        if (isHeaderDate(current)) {
            const previous = scanner.recall();
            if (null == previous || isNewlineToken(previous)) {
                const next = scanner.peek();
                if (null != next && isHeaderTime(next)) {
                    headers.push(`${current.value} ${next.value}`);
                }
            }
        }
    }
    console.log(JSON.stringify(headers));
}

export function* cycleEntries(cycle: string) {
    const tokenizer = new TextTokenizer(cycle, {includeNewline: true}),
        scanner = new TokenScanner(tokenizer);
    let current: Token | undefined,
        header: string | undefined;
    for (let current of scanner) {
        if (isHeaderDate(current)) {
            const previous = scanner.recall();
            if (null == previous || isNewlineToken(previous)) {
                const next = scanner.peek();
                if (null != next && isHeaderTime(next)) {
                    yield `${current.value} ${next.value}`;
                }
            }
        }
    }
}

function isTextMatching(pattern: RegExp) {
    return (token: Token): token is TextToken => isTextToken(token) && pattern.test(token.value);
}

const isHeaderDate = isTextMatching(/^\d{4}\/\d{2}\/\d{2}$/),
    isHeaderTime = isTextMatching(/^\d{2}:\d{2}$/);
