import {freeze} from "immer";
import _, {Dictionary} from "lodash";
import {DateTime, Interval} from "luxon";
import {DateCalc} from "../../utils/DateCalc";
import {Forecast} from "../IntegrationTypes";

/**
 * Tokenize a TAF entry. Split symbols on whitespace and remove some spurious symbols, such as multiple `AMD`,
 * `COR`, and/or `TAF` prefixes at the start of the entry. First line of the returned entry will always begin with
 * `TAF` and will be followed by exactly zero or one of `AMD` *or* `COR` if the TAF is an amendment or a correction.
 *
 * @param entry the TAF entry (including the header line.)
 */
export function tokenizeEntry(entry: Array<string>): TokenizedEntry {
    const [header, ...lines] = entry,
        groups = new RegExp(entryHeader).exec(header)!;
    return {
        received: DateTime.fromFormat(groups[1], "yyyy/M/d H:m", {zone: "UTC"}),
        lines: _.transform(lines, (acc, line) => {
            const tokens = normalizeTokens(line.split(/\s+/), 0 === acc.length);
            if (acc.length > 1) {
                acc.push(tokens)
            } else if (1 === acc.length && null != acc[0].find(token => -1 === prefixTokens.indexOf(token))) {
                acc.push(tokens);
            } else {
                const filteredTokens = tokens.filter(token => -1 === prefixTokens.indexOf(token));
                if (0 === acc.length) {
                    acc.push(filteredTokens);
                } else {
                    acc[0].push(...filteredTokens);
                }
            }
        }, new Array<Array<string>>()),
        ...("Ammendment" !== groups[3] ? {} : {revision: "amendment"}),
        ...("Correction" !== groups[3] ? {} : {revision: "correction"})
    };
}

/**
 * Splits individual TAF entries out of the content of a cycle file. Also splits joined TAFs on `=` delimiters.
 * Returns an array of arrays of strings. The top level array is TAF entries, the second level array is lines in the
 * entry. The first line in each entry is always the entry header line (it is copied to each split of a joined
 * entry.)
 *
 * @param content the content of the cycle file.
 */
export function splitCycle(content: string) {
    return _.transform(content.split(/\r?\n/), (acc, line) => {
        const trimmed = line.trim();
        if (entryHeader.test(trimmed)) {
            acc.push([trimmed]);
        } else if ("" !== trimmed) {
            trimmed.split("=").forEach((subLine, index) => {
                const trimmed = subLine.trim();
                if ((0 === index && "" !== trimmed) || trimmed.startsWith("TAF ")) {
                    let top = _.last(acc);
                    if (null != top) {
                        if (index > 0) {
                            acc.push(top = [top[0]]);
                        }
                        top.push(trimmed);
                    }
                }
            });
        }
    }, new Array<Array<string>>());
}

/**
 * Normalize the tokens on a TAF data line.
 * * Remove `PART x OF y` prefix.
 * * If `BECMG` or `TEMPO` and its time window are jammed together, split them apart.
 *
 * @param tokens the line tokens.
 * @param excludeBeforePrefix flag indicating whether to remove tokens before the first prefix token (if present.)
 */
function normalizeTokens(tokens: Array<string>, excludeBeforePrefix = false) {
    let included = [...tokens];
    if (excludeBeforePrefix) {
        const firstPrefix = included.findIndex(token => -1 !== prefixTokens.indexOf(token));
        if (firstPrefix > 0) {
            included.splice(0, firstPrefix);
        }
    }
    const [first] = included;
    if (null != first) {
        if ("PART" === first && "OF" === included[2]) {

            /* Remove "PART x OF y" */
            included.splice(0, 4);
        } else {

            /* Split incorrectly conjoined segment prefixes. */
            splitSegmentPrefixes.forEach(symbol => {
                if (first.startsWith(symbol) && first !== symbol) {
                    included.splice(0, 1, symbol, first.substring(symbol.length));
                }
            });
        }
    }
    return included;
}

/**
 * Parse a TAF-style day/hour interval string (`DDhh/DDhh`, start day-of-month, start hour, end day-of-month, end hour)
 * value to a {@link Interval} based on a reference {@link DateTime}, from which the year, month, and day are resolved.
 *
 * @param reference the reference date/time.
 * @param value the value to parse.
 */
export function parseDayHourInterval(reference: DateTime, value: string) {
    const [start, end] = value.split("/");
    return Interval.fromDateTimes(parseDayTime(reference, `${start}00`), parseDayTime(reference, `${end}00`));
}

/**
 * Parse a TAF-style day/time string (`DDhhmm`, day-of-month, hour, minute) value to a full {@link DateTime} based
 * on a reference {@link DateTime}, from which the year, month, and day are resolved.
 *
 * @param reference the reference date/time.
 * @param value the value to parse.
 */
export function parseDayTime(reference: DateTime, value: string) {
    const [day, hour, minute] = /\D*(\d{2})(\d{2})(\d{2})\D*/.exec(value)!
        .slice(1)
        .map(value => parseInt(value, 10));
    if (day < reference.day) {
        return reference.plus({month: 1}).startOf("month").set({day, hour, minute});
    }
    return reference.plus({day: day - reference.day}).startOf("day").set({hour, minute});
}

export function parseTafEntry(entry: TokenizedEntry) {
    const {lines: [outlookLine, ...detailLines], received} = entry,
        outlook = new LineScanner(received, outlookLine),
        station = outlook.consume(),
        issued = outlook.consumeOptionalDayTime() || received,
        valid = outlook.consumeDayHourInterval();
    parsePhenomena(outlook);
}

function parsePhenomena(line: LineScanner) {
    let type = "initial";
    while (!line.complete()) {
        const next = line.consume(),
            match = Object.entries(tafTransitions)
                .filter(([, types]) => -1 !== types.indexOf(type))
                .map(([key]) => [key, tafTokens[key]] as const)
                .map(([key, pattern]) => [key, new RegExp(pattern).exec(next)] as const)
                .find(([key, match]) => null != match);
        if (null == match) {
            if (!/5\d{5}/.test(next)
                && !/6\d{5}/.test(next)
                && next !== "2418Z"
                && "1" !== next
                && "2" !== next
                && "0000KT" !== next
                && "T" !== next
                && "FOR" !== next
                && next !== "SCT0008") {
                throw Error();
            }
            throw Error();
        }
        console.log(`[${next}]: [${type}] => [${match[0]}]`);
        type = match[0];
    }
}

class LineScanner {
    private position = 0;

    constructor(private reference: DateTime, private line: Array<string>) {
    }

    consume() {
        return this.next(true);
    }

    complete() {
        return this.position >= this.line.length;
    }

    consumeDayHourInterval() {
        return parseDayHourInterval(this.reference, this.consume());
    }

    consumeIf(predicate: (token: string) => boolean) {
        const next = this.next();
        if (predicate(next)) {
            return this.next(true);
        }
    }

    consumeOptionalDayTime() {
        const next = this.consumeIf(token => /\d{6}Z?/.test(token));
        if (next) {
            return parseDayTime(this.reference, next);
        }
    }

    /**
     * Get the previous token, returning `undefined` if the next token is the first token, meaning there is no previous
     * token.
     */
    lookBehind() {
        const {line, position} = this;
        if (position > 0) {
            return line[position - 1];
        }
    }

    /**
     * Get the next token without consuming it, returning `undefined` if all tokens have been consumed.
     */
    lookAhead() {
        const {line, position} = this;
        if (position < line.length - 1) {
            return line[position];
        }
    }

    private next(consume = false) {
        const {line, position} = this;
        if (position >= line.length) {
            throw Error();
        }
        if (consume) {
            ++this.position;
        }
        return line[position];
    }
}

export class TafParser {
    private constructor(
        private dates: DateCalc
    ) {

    }

    parse(text: string): Array<Forecast> {

        /* Parse the header and content lines. Note that TAFs occasionally contain data for multiple stations, separated
        by "TAF" tokens in the middle. Split these to separate 2D arrays of individual tokens. */
        const [header, ...elements] = text.split(/\n+/)
                .map(line => line.trim())
                .filter(line => "" !== line),
            [date, time] = header.split(/\s+/),
            received = DateTime.fromFormat(`${date} ${time}`, "yyyy/M/d H:m", {zone: "UTC"}),
            tokens = _.transform(elements.join(" ").split(/\s+/), (acc, token) => {
                const top = acc[acc.length - 1];
                if ("AMD" === token || "COR" === token) {
                    if (token !== _.first(top)) {
                        top.unshift(token);
                    }
                } else if ("TAF" !== token) {
                    top.push(token);
                } else if (!_.isEmpty(top)) {
                    acc.push([]);
                }
            }, new Array(new Array<string>));

        /* Now we have (in 'tokens') an array of arrays: outer array is each individual TAF (will usually only be one
        element in this array) and the inner array is the individual tokens in each TAF. For each individual TAF, the
        first token will be "AMD" or "COR" if the TAF is an amendment or a correction, respectively. */
        return tokens.filter(entry => entry.length > 1 && "PART" !== entry[0])
            .map(entry => {

                /* Shift the AMD or COR token off of the token array if necessary. */
                const amendment = "AMD" === _.first(entry),
                    correction = "COR" === _.first(entry);
                if (amendment || correction) {
                    entry.shift();
                }

                /* Parse the TAF entry. */
                const [station, issued, effective, ...elements] = entry,
                    issuedDateTime = parseDayTime(received, issued),
                    [effectiveStart, effectiveEnd] = effective.split("/"),
                    effectiveInterval = Interval.fromDateTimes(
                        parseDayTime(received, `${effectiveStart}00`),
                        parseDayTime(received, `${effectiveEnd}00`)
                    ),
                    periods = this.splitPeriods(effectiveInterval.start!, elements);
                return {
                    effective: effectiveInterval,
                    issued: issuedDateTime,
                    periods: []
                };
            });
    }

    private splitPeriods(start: DateTime, tokens: Array<string>): Array<Array<string>> {

        /* Split time periods. Note that we fake a "FM" group for the first TAF line. */
        const periods = _.transform(tokens, (acc, next, index, all) => {
            if ("BECMG" === next || "TEMPO" === next || next.startsWith("FM") || next.startsWith("PROB")) {
                acc.push([next]);
            } else {
                _.last(acc)!.push(next);
            }
        }, new Array([`FM${start.toFormat("ddhhmm")}`]));

        /* Occasionally a PROB group appears at the end of a BECMG group and refers to the entire group rather than
        having its own associated interval. Look for these and move the probability back to the group. */
        for (let i = periods.length - 1; i > 0; i -= 1) {
            const period = periods[i],
                token = period[0];
            if (1 === period.length && token.startsWith("PROB")) {
                periods[i - 1].push(token);
                periods.splice(i, 1);
            }
        }
        return periods;
    }

    static create() {
        return freeze(new TafParser(DateCalc.create("UTC")));
    }
}

interface TokenizedEntry {
    received: DateTime;
    lines: Array<Array<string>>;
    revision?: "amendment" | "correction";
}

class TafSegment {
    end?: DateTime;

    constructor(
        public start: DateTime | Interval,
        end?: DateTime
    ) {
        this.end = end;
    }
}

/**
 * Header line which begins a new entry in a cycle file ("amendment" is always misspelled.)
 */
const entryHeader = freeze(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2})(\s+(Ammendment|Correction))?$/, true);

/**
 * TAF prefix tokens.
 */
const prefixTokens = freeze(["TAF", "AMD", "COR"]);

/**
 * Segment prefixes which are sometimes jammed up against their following symbols and need to be split.
 */
const splitSegmentPrefixes = freeze(["BECMG", "TEMPO"]);

const tafTokens: Dictionary<RegExp> = freeze({
    altimeter: /^QNH(\d{4})(INS)?$/,
    cancellation: /CNL/,
    wind: /^((VRB)|\d{3})(\d{2})(G\d{2})?(KT|MPS)$/,
    windshear: /WS(\d{3})\/(\d{3})(\d{2})(KT|MPS)/,
    windVariability: /^(\d{3})V(\d{3})$/,
    visibility: /^(CAVOK)|(\d{4})|(P6|\d)SM$/,
    cloud: /^NSC|((FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?)$/,
    intermittent: /INTER/,
    interval: /^\d{4}\/\d{4}$/,
    obscuration: /^NSW|([+-]?[A-Z]{2}([A-Z]{2})?)$/,
    probability: /^PROB(\d{2})$/,
    rvr: /^R\d{2}\/\d{4}(FT)?[DN]?$/,
    temperature: /^T[NX]M?\d{2}\/(\d{4}Z?)?$/,
    verticalVisibility: /VV(\d{3})/
});

const tafTransitions: Dictionary<Array<string>> = freeze({
    altimeter: ["cloud"],
    cancellation: ["initial"],
    wind: ["initial", "interval"],
    windshear: ["cloud"],
    windVariability: ["wind"],
    visibility: ["interval", "wind", "windVariability"],
    cloud: ["cloud", "interval", "obscuration", "visibility", "wind"],
    intermittent: ["cloud", "probability"],
    interval: ["intermittent", "probability"],
    obscuration: ["cloud", "interval", "obscuration", "rvr", "visibility"],
    probability: ["cloud", "obscuration", "temperature", "visibility"],
    rvr: ["rvr", "visibility"],
    temperature: ["altimeter", "cloud", "obscuration", "temperature", "visibility"],
    verticalVisibility: ["obscuration"]
});
