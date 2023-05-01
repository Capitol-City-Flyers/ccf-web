import {freeze} from "immer";
import _ from "lodash";
import {DateTime} from "luxon";
import {CycleEntry} from "./NoaaTypes";

/**
 * Parse individual entries out of the content of a cycle file. For TAF cycles, also splits merged entries on `=`
 * delimiters.
 *
 * @param cycle the cycle file content.
 */
export function parseCycle(cycle: string) {

    /* Split raw entries. */
    const matcher = new RegExp(entryHeader),
        entries = new Array<string>();
    let match: RegExpExecArray | null,
        start = 0;
    while (null !== (match = matcher.exec(cycle))) {
        const {index} = match;
        if (index > start) {
            entries.push(cycle.substring(start, index));
        }
        start = index;
    }
    if (start > 0) {
        entries.push(cycle.substring(start));
    }

    /* Split lines and extract merged entries. */
    return _.transform(entries, (acc, entry, index) => {
        const subEntries = entry.split("=")
                .map(subEntry =>
                    subEntry.split(/\r?\n/)
                        .map(_.trim)
                        .filter(line => "" != line)
                ),
            header = subEntries[0].shift()!,
            match = new RegExp(entryHeader).exec(header)!,
            timestamp = DateTime.fromFormat(match[1], "yyyy/M/d H:m", {zone: "UTC"}),
            amendment = header.endsWith("Ammendment"), /* always misspelled. */
            correction = header.endsWith("Correction");
        subEntries.forEach(content => {
            acc.push({
                content,
                timestamp,
                ...(amendment && {revised: "amendment"}),
                ...(correction && {revised: "correction"})
            });
        });
    }, new Array<CycleEntry>());
}

const entryHeader = freeze(/((\d{4}\/\d{2}\/\d{2}) (\d{2}:\d{2}))/g, true);
