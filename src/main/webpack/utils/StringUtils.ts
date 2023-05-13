/**
 * Split a string into *records* where each record begins with a *header* matching some pattern.
 *
 * @param value the string to split.
 * @param header the header pattern.
 */
export function* iterateRecords(value: string, header: RegExp) {
    const matcher = new RegExp(header, "g");
    let start = 0,
        match: RegExpExecArray | null;
    do {
        match = matcher.exec(value);
        const end = match ? match.index : value.length,
            entry = value.substring(start, end);
        yield entry;
        start = end;
    } while (null != match);
}
