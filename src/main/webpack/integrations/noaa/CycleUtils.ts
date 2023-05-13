import {iterateRecords} from "../../utils/StringUtils";
import {DateTime} from "luxon";
import _ from "lodash";

export function* iterateEntries(cycle: string): Iterable<CycleEntry> {
    for (let entry of iterateRecords(cycle, header)) {
        const trimmed = entry.trim();
        if (trimmed) {
            const index = trimmed.indexOf("\n"),
                header = trimmed.substring(0, index).trim(),
                issued = DateTime.fromFormat(header.substring(0, 16), "yyyy/M/d H:m", {zone: "UTC"}),
                entries = trimmed.substring(index + 1).split("=").map(_.trim).filter(_.identity);
            for (let content of entries) {
                yield {content, header, issued};
            }
        }
    }
}

interface CycleEntry {
    content: string;
    header: string;
    issued: DateTime;
}

const header = /\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/;