import _ from "lodash";
import {DateTime, Interval} from "luxon";
import Tokenizr, {Token} from "tokenizr";
import {CycleEntry} from "./NoaaTypes";

export function parseTaf(entry: CycleEntry) {
    lexer.input(entry.content.join(" "));
    let token: Token;
    while (null != (token = lexer.token())) {
        console.dir(token);
    }
    lexer.finish(ctx => {
        console.dir(ctx);
    });
}

const lexer = (() => {
    const ALTIMETER = /QNH(\d{4})(INS)?/,
        CLOUD = /NSC|SKC|((FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?)/,
        DAY_TIME = /(\d{2})(\d{4})Z?/,
        DAY_HOUR_RANGE = /(\d{2})(\d{2})\/(\d{2})(\d{2})/,
        FROM = /FM((\d{2})(\d{4}))?/,
        ICING = /6(\d{5})/,
        INCOMPLETE = /(\/{2,}\S+)|(\S+\/{2,})/,
        PROBABILITY = /PROB(\d{2})/,
        VISIBILITY = /CAVOK|(\d{4})|(P6|\d)SM/,
        PHENOMENA = /NSW|([+-]?[A-Z]{2}([A-Z]{2}(\/[A-Z]{2})*)?)/,
        RVR = /R(\d{2})\/(\d{4})(FT)?[DN]?/,
        TEMPERATURE = /T[NX]M?\d{2}\/(\d{4}Z?)?/,
        TURBULENCE = /5(\d{5})/,
        VERTICAL_VISIBILITY = /VV(\d{3})/,
        WIND = /(VRB|(\d{3}))(\d{2})(G(\d{2}))?(KT|MPS)/,
        WIND_SHEAR = /WS(\d{3})\/(\d{3})(\d{2})(KT|MPS)/;
    return new Tokenizr()

        /* Any state. */
        .rule(/\s+/, ctx => {
            ctx.ignore();
        })
        .rule(/RMK/, ctx => {
            ctx.ignore().push("remark");
        })

        /* "default" (initial) state. */
        .rule("default", /AMD|COR|TAF/, ctx => {
            ctx.ignore();
        })
        .rule("default", /[A-Z]{4}/, ctx => {
            ctx.accept("station");
        })
        .rule("default", DAY_TIME, ctx => {
            ctx.accept("dayTime");
        })
        .rule("default", DAY_HOUR_RANGE, ctx => {
            ctx.accept("dayHourRange");
        })
        .rule("default", /\S+/, ctx => {
            ctx.repeat().push("forecast");
        })

        /* "forecast" state. */
        .rule("forecast", /AMDS/, ctx => {
            ctx.repeat().push("remark");
        })
        .rule("forecast", /BECMG/, ctx => {
            ctx.accept("becoming").push("window");
        })
        .rule("forecast", PROBABILITY, ctx => {
            ctx.accept("probability").push("window");
        })
        .rule("forecast", /TEMPO/, ctx => {
            ctx.accept("temporary").push("window");
        })
        .rule("forecast", /CNL/, ctx => {
            ctx.accept("canceled").stop();
        })
        .rule("forecast", /INTER/, ctx => {
            ctx.accept("intermittent").push("window");
        })
        .rule("forecast", FROM, (ctx, match) => {
            ctx.accept("from");
            if (null == match[1]) {
                ctx.push("window");
            }
        })
        .rule("forecast", INCOMPLETE, ctx => {
            ctx.accept("incomplete");
        })
        .rule("forecast", WIND, ctx => {
            ctx.accept("wind");
        })
        .rule("forecast", ALTIMETER, ctx => {
            ctx.accept("altimeter");
        })
        .rule("forecast", CLOUD, ctx => {
            ctx.accept("cloud");
        })
        .rule("forecast", RVR, ctx => {
            ctx.accept("rvr");
        })
        .rule("forecast", VERTICAL_VISIBILITY, ctx => {
            ctx.accept("verticalVisibility");
        })
        .rule("forecast", ICING, ctx => {
            ctx.accept("icing");
        })
        .rule("forecast", TURBULENCE, ctx => {
            ctx.accept("turbulence");
        })
        .rule("forecast", VISIBILITY, ctx => {
            ctx.accept("visibility");
        })
        .rule("forecast", TEMPERATURE, ctx => {
            ctx.accept("temperature");
        })
        .rule("forecast", PHENOMENA, ctx => {
            ctx.accept("phenomena");
        })

        /* "window" state. */
        .rule("window", DAY_TIME, ctx => {
            ctx.accept("dayTime");
        })
        .rule("window", DAY_HOUR_RANGE, ctx => {
            ctx.accept("dayHourRange");
        })
        .rule("window", /\S+/, ctx => {
            ctx.repeat().pop();
        })

        /* "remark" state. */
        .rule("remark", /\S+/, ctx => {
            ctx.accept("remark");
        })

        .rule(/\S+/, ctx => {
            ctx.accept("unknown");
        });
})();

function createLexer(reference: DateTime) {
    const Tokens = {
        CLOUD: /NSC|((FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?)/,
        DAY_TIME: /(\d{2})(\d{4})Z?/,
        DAY_HOUR_RANGE: /(\d{2})(\d{2})\/(\d{2})(\d{2})/,
        PROBABILITY: /PROB(\d{2})/,
        STATION: /[A-Z]{4}/,
        VISIBILITY: /CAVOK|(\d{4})|(P6|\d)SM/,
        PHENOMENON: /NSW|([+-]?[A-Z]{2}([A-Z]{2})?)/,
        WIND: /(VRB|(\d{3}))(\d{2})(G(\d{2}))?(KT|MPS)/,
        WIND_SHEAR: /WS(\d{3})\/(\d{3})(\d{2})(KT|MPS)/
    };
    const accumulator = new TafAccumulator(reference);
    return new Tokenizr()

        /* Always ignore whitespace. */
        .rule(/\s+/, ctx => {
            ctx.ignore();
        })

        /* State: default (initial) */
        .rule("default", /AMD|COR|TAF/, ctx => {
            ctx.ignore();
        })
        .rule("default", /[A-Z]{4}/, (ctx, match) => {
            ctx.push("header").accept("station", match[0]);
        })
        .rule("default", /PART/, ctx => {
            ctx.push("part");
        })

        /* State: part */
        .rule("part", /\d/, ctx => {
            ctx.accept("number");
        })
        .rule("part", /OF/, ctx => {
            ctx.ignore();
        })
        .rule("part", /\S+/, ctx => {
            ctx.repeat().pop();
        })

        /* State: header */
        .rule("header", Tokens.DAY_TIME, (ctx, match) => {
            ctx.accept("issued", parseDayTime(reference, match[0]));
        })
        .rule("header", Tokens.DAY_HOUR_RANGE, (ctx, match) => {
            ctx.accept("effective", parseDayHourInterval(reference, match[0]));
        })
        .rule("header", /\S+/, ctx => {

            /* Pop "header" and transition to "weather" and rewind on any other token. */
            ctx.pop();
            ctx.repeat().push("weather");
        })

        /* State: weather */
        .rule("weather", Tokens.WIND, (ctx, match) => {
            ctx.accept("wind", match[0]);
        })
        .rule("weather", Tokens.CLOUD, (ctx, match) => {
            ctx.accept("cloudLayer");
            if ("NSC" !== match[0]) {
                const coveragePrefix = match[2];
                let coverage: CloudCoverage;
                if ("BKN" === coveragePrefix) {
                    coverage = "broken";
                } else if ("FEW" === coveragePrefix) {
                    coverage = "few";
                } else if ("OVC" === coveragePrefix) {
                    coverage = "overcast";
                } else if ("SCT" === coveragePrefix) {
                    coverage = "scattered";
                } else {
                    throw Error(`Unsupported cloud coverage value [${match[2]}].`);
                }
                accumulator.cloudLayer(100 * parseInt(match[3], 10), coverage);
            }
        })
        .rule("weather", Tokens.PROBABILITY, (ctx, match) => {
            ctx.accept("probability", match[0]).push("probability");
        })
        .rule("weather", Tokens.VISIBILITY, (ctx, match) => {
            ctx.accept("visibility", match[0]);
        })
        .rule("weather", Tokens.PHENOMENON, (ctx, match) => {
            ctx.accept("phenomenon", match[0]);
        })

        /* State: probability */
        .rule("probability", Tokens.DAY_HOUR_RANGE, (ctx, match) => {
            ctx.accept("effective", parseDayHourInterval(reference, match[0]));
        })
        .rule("probability", /\S+/, ctx => {
            ctx.push("weather").repeat();
        });
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

class TafAccumulator {
    constructor(private reference: DateTime) {
    }

    cloudLayer(height: number, coverage: CloudCoverage) {
        console.log(`cloudLayer: height=${height * 100}, coverage=${coverage}`);
    }

    station(ident: string) {
        console.log(`station: ${ident}`);
    }
}

type CloudCoverage = "few" | "scattered" | "broken" | "overcast";
