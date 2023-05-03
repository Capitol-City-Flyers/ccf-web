import {readUtf8TextResources} from "../../utils/TestDataUtils";
import moo, {Token} from "moo";

describe("TafLexer", () => {
    const lexer = (() => {
        const ALTIMETER = /QNH\d{4}(?:INS)?/,
            DAY_TIME = /\d{2}\d{4}Z?/,
            DAY_HOUR_RANGE = /\d{2}\d{2}\/\d{2}\d{2}/,
            HEADER_DATE_TIME = /\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/,
            DIGITS = /\d+/,
            PHENOMENON = /[+-]?[A-Z]{2}/,
            PROBABILITY = /PROB\d0/,
            STATION = /[A-Z][A-Z0-9]{3}/,
            WHITESPACE = /[ \t]+/,
            WIND = /(?:VRB|\d{3})\d{2}(?:G\d{2})?(?:KT|MPS)/;
        return moo.states({
            main: {
                NL: {match: "\n", lineBreaks: true},
                WS: WHITESPACE,
                header: {
                    match: HEADER_DATE_TIME,
                    next: "header"
                }
            },
            header: {
                NL: {
                    match: "\n",
                    lineBreaks: true,
                    next: "leader"
                },
                WS: WHITESPACE,
                attribute: ["Ammendment", "Correction"]
            },
            leader: {
                NL: {match: "\n", lineBreaks: true},
                WS: WHITESPACE,
                header: {
                    match: HEADER_DATE_TIME,
                    next: "header"
                },
                prefix: ["AMD", "COR", "TAF"],
                station: {
                    match: STATION,
                    next: "content"
                }
            },
            content: {
                NL: {match: "\n", lineBreaks: true},
                WS: WHITESPACE,
                header: {
                    match: HEADER_DATE_TIME,
                    next: "header"
                },
                delim: {
                    match: "=",
                    next: "leader"
                },
                cloud: [{
                    match: ["BKN", "FEW", "OVC", "SCT"],
                    push: "cloud"
                }, {
                    match: "NSC"
                }],
                cavok: "CAVOC",
                intermittent: "INTER",
                segment: ["BECMG", "TEMPO"],
                altimeter: ALTIMETER,
                dayHourRange: DAY_HOUR_RANGE,
                dayTime: DAY_TIME,
                probability: PROBABILITY,
                wind: WIND,
                from: {
                    match: "FM",
                    push: "from"
                },
                phenomenon: [{
                    match: PHENOMENON,
                    push: "phenomenon"
                }, {
                    match: "NSW"
                }],
                digits: DIGITS,
                unknown: {
                    fallback: true
                }
            },
            cloud: {
                END: [
                    {
                        match: WHITESPACE,
                        pop: 1
                    },
                    {
                        match: "\n",
                        lineBreaks: true,
                        pop: 1
                    }
                ],
                height: DIGITS,
                type: ["CB", "TCU"]
            },
            from: {
                END: {
                    match: "\n",
                    lineBreaks: true,
                    pop: 1
                },
                dayTime: {
                    match: DAY_TIME,
                    pop: 1
                }
            },
            phenomenon: {
                END: [
                    {
                        match: WHITESPACE,
                        pop: 1
                    },
                    {
                        match: "\n",
                        lineBreaks: true,
                        pop: 1
                    }
                ],
                delim: "/",
                phenomenon: PHENOMENON
            }
        });
    })();
    test("Test", () =>
        readUtf8TextResources("./cycles/noaa/taf/taf-20230424-00Z.txt.br")
            .then(([[path, content]]) => {
                lexer.reset(content);
                let token: Token | undefined;
                while (null != (token = lexer.next())) {
                    const {type} = token;
                    if (null == type || -1 !== ["WS", "NL"].indexOf(type)) {
                        console.log(`[${token.type}] => [${token.value}]`);
                    }
                }
            }));
});
