import {parseTAF} from "metar-taf-parser";

export function flightCategoryIntervals(taf: string) {
    const parsed = parseTAF(taf);
    parsed.trends.forEach(console.log);
}