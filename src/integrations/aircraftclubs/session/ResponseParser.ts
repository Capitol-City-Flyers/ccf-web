import {freeze} from "immer";
import _ from "lodash";
import {DateTime, IANAZone} from "luxon";
import type {Zone} from "luxon";
import type {Reservation} from "../../../providers/database/database-types";
import type {GetBookingsForCalendarResponse, GetMembersResponse, LoginSuccess} from "../aircraftclubs-types";
import {AircraftIdent} from "../../../aircraft/aircraft-types";

/**
 * {@link ResponseParser} parses AircraftClubs API responses into simple data objects.
 */
export class ResponseParser {
    private readonly zone: Zone;

    private constructor(login: LoginSuccess) {
        this.zone = IANAZone.create(login.timezone);
    }

    parseGetBookingsForCalendarResponse(response: GetBookingsForCalendarResponse, aircraft: AircraftIdent) {
        return freeze<Array<Reservation>>(response.map(booking => {
            const {zone} = this,
                times = _.mapValues({
                    endDateTime: booking.end,
                    startDateTime: booking.start
                }, dateTime => {
                    const [dateString, timeString] = dateTime.split(/\s+/),
                        [year, month, date] = dateString.split("-").map(value => parseInt(value, 10)),
                        [hour, minute, second] = timeString.split(":").map(value => parseInt(value, 10));
                    return DateTime.local(year, month, date, hour, minute, second, 0, {zone});
                });
            return {
                dateTimeRange: times.startDateTime.setZone("utc").until(times.endDateTime.setZone("utc")).toISO(),
                kind: "aircraft",
                ref: {"aircraftClubs": booking.id},
                tailNumber: aircraft.tailNumber
            };
        }));
    }

    /**
     * Parse a `./functions/member/getMembers.php` response.
     *
     * @param root the response document.
     */
    parseGetMembers(root: ParentNode) {
        const table = root.querySelector<HTMLTableElement>("#memberTable")!,
            rowDataCells = this.tableRowDataCells(table);
        return freeze<GetMembersResponse>(rowDataCells.map(data => {
            const {
                ["Unique ID"]: memberId,
                ["Name"]: fullName,
                ["Email"]: email,
                ["Mobile"]: mobile,
                ["StatusID"]: statusId
            } = _.mapValues(data, td => this.extractText(td));
            let status: GetMembersResponse[number]["status"];
            switch (statusId) {
                case "1":
                    status = "active";
                    break;
                case "2":
                    status = "inactive";
                    break;
                case "3":
                    status = "deleted";
                    break;
                case "5":
                    status = "locked";
                    break;
                default:
                    throw Error(`Unsupported member status [${statusId}].`);
            }
            return {
                id: parseInt(memberId, 10),
                email: email || null,
                mobile: !mobile ? null : mobile.replace(/\D/g, ""),
                fullName, status
            };
        }), true);
    }

    /**
     * Extract all text from a `node` and all of its children into a single, joined string.
     *
     * @param node the node.
     */
    private extractText(node: Node) {
        return _.toArray(node.childNodes)
            .filter(({nodeType}) => 3 === nodeType)
            .map(({textContent}) => textContent!)
            .filter(text => !!text)
            .join(" ")
            .replace(/\s{2,}/g, " ");
    }

    /**
     * Parse a table into an array of {@link TableRowDataCells} objects.
     *
     * @param table the table whose rows are to be extracted.
     */
    private tableRowDataCells(table: HTMLTableElement) {
        const names = _.toArray(table.querySelectorAll<HTMLTableHeaderCellElement>("thead th"))
            .map(th => _.toArray(th.childNodes).reduce((acc, next) => {
                if (3 === next.nodeType) {
                    return acc + next.textContent;
                }
                return acc;
            }, ""));
        return _.toArray(table.querySelectorAll<HTMLTableRowElement>("tbody tr"))
            .map(tr => _.toArray(tr.querySelectorAll("td"))
                .map((td, index) => [names[index], td] as const)
                .filter(([name]) => !!name)
                .reduce((previous, [name, td]) => ({
                    ...previous,
                    [name]: td
                }), EMPTY_ROW_DATA));
    }

    static create(login: LoginSuccess) {
        return freeze(new ResponseParser(login));
    }
}

/**
 * Empty {@link TableRowDataCells} instance.
 */
const EMPTY_ROW_DATA = freeze<TableRowDataCells>({});

/**
 * Single row of data cells extracted from a table. Cells are keyed on *name*, which is the text content of the
 * corresponding `th` node in the table header.
 */
type TableRowDataCells = {
    [name in string]: HTMLTableDataCellElement
};
