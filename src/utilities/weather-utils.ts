
export function flightCategoryIntervals(taf: string) {
    const {parseTAF} = require("metar-taf-parser");
    const parsed = parseTAF(taf);
    parsed.trends.forEach(console.log);
}