import {freeze, immerable} from "immer";
import _, {Dictionary} from "lodash";
import {DateTime, Interval} from "luxon";
import {Aircraft} from "../../data";
import {isMethodInvocation, JsExtractor} from "../../utils/JsExtractor";
import {
    AircraftClubsBooking,
    AircraftClubsBookingDetail
} from "../../components/auth/aircraftclubs/AircraftClubsClient";
import {AircraftClubsSession} from "../../components/auth/aircraftclubs/AircraftClubsSession";
import {
    BillingSource,
    BillingUnit,
    GetAddSquawkDialogResponse,
    GetAircraftResponse,
    GetBookingsForCalendarResponse,
    GetClubAircraftsResponse,
    GetMaintenanceItemsResponse,
    GetMemberResponse,
    GetMembersResponse,
    GetSquawkLogResponse
} from "./AircraftClubsResponseTypes";
import {ClubReservationOverview, PhoneNumberType} from "../IntegrationTypes";

type GetMembersResponseItem = GetMembersResponse[number];

/**
 * {@link AircraftClubsResponseParser} parses responses to AircraftClubs data requests.
 */
export class AircraftClubsResponseParser {
    [immerable] = true;

    parseGetAddSquawkDialog(session: AircraftClubsSession, root: ParentNode) {
        const form = root.querySelector<HTMLFormElement>("#squawkForm")!,
            elements = formDataElements(form),
            values: Dictionary<any> = {};
        _.transform(elements, (values, [nameElement, valueElement]) => {
            const {name} = nameElement;
            if (isHTMLTextAreaElement(valueElement)) {
                values[name] = extractText(valueElement);
            } else if (isHTMLOptionElement(valueElement)) {
                values[name] = valueElement.value;
            } else if (isHTMLInputElement(valueElement)) {
                if ("checkbox" === valueElement.type) {
                    values[name] = valueElement.checked;
                } else {
                    values[name] = valueElement.value;
                }
            }
        }, values);
        return freeze<GetAddSquawkDialogResponse>({
            id: parseInt(values["squawkID"], 10),
            aircraftId: parseInt(values["aircraftID"], 10),
            memberId: parseInt(values["personID"], 10),
            comments: values["comments"] || null,
            date: this.parseDateToIsoString(session, values["date"]),
            description: values["description"],
            ground: values["ground"],
            status: values["closed"] ? "closed" : "open",
            attachmentIds: !values["fileID"] ? [] : [parseInt(values["fileID"], 10)]
        });
    }

    parseGetAircraft(session: AircraftClubsSession, root: ParentNode) {

        /* Accumulate key/value pairs from static HTML. First, simple pairs from 'form-group' divs. */
        const htmlValues: Dictionary<null | string> = {};
        _.transform(_.toArray(root.querySelectorAll("div.form-group")), (acc, group) => {
            const label = group.querySelector("label.control-label");
            if (null != label) {
                const key = label.textContent!.trim().replace(/:$/g, "");
                const value = group.querySelector("p.form-control-static");
                if (null != value && "I" !== value.firstChild!.nodeName) {
                    acc[key] = value.textContent!.trim();
                }
            }
        }, htmlValues);

        /* Next, multiline pairs from 'panel' divs. */
        _.transform(_.toArray(root.querySelectorAll("div.panel")), (acc, panel) => {
            const title = panel.querySelector("h3.panel-title");
            if (null != title) {
                const key = title.textContent!.trim()!;
                const value = panel.querySelector("div.panel-body p");
                if (null != value && "I" !== value.firstChild!.nodeName) {
                    acc[key] = value.textContent!.trim();
                }
            }
        }, htmlValues);

        /* Aircraft ID doesn't appear in the HTML, so we need to capture it from an $.ajax() call. */
        const script = root.querySelector("#aircraftPhotosContainer script")!.innerHTML,
            [ajaxValues] = jQueryAjaxDataExtractor.execute(script);

        /* Assemble and return response. */
        const billingSegments = htmlValues["Billing Rate"]?.split("/");
        return freeze<GetAircraftResponse>({
            id: Number(ajaxValues["aircraft"]),
            tailNumber: htmlValues["Tail Number"]!,
            airframe: {
                model: htmlValues["Aircraft Type"]!,
                year: parseInt(htmlValues["Model year"]!)
            },
            billing: !billingSegments ? null : {
                currency: "USD",
                includesFuel: 0 === htmlValues["Rate Type"]!.indexOf("Wet"),
                rate: Number(billingSegments[0]),
                source: htmlValues["Billed by"]!.toLowerCase() as BillingSource,
                unit: billingSegments[1].toLowerCase()! as BillingUnit
            },
            description: htmlValues["Description"]!,
            equipment: htmlValues["Equipment / Avionics"]!,
            rules: htmlValues["Rating"]!.toLowerCase() as GetAircraftResponse["rules"],
            engine: htmlValues["Engine"]!,
            location: htmlValues["Location"] || null,
            reservationNotes: htmlValues["Reservation Notes"] || null
        }, true);
    }

    parseGetBookingsForCalendar(
        session: AircraftClubsSession,
        aircraftId: number,
        bookings: GetBookingsForCalendarResponse
    ) {
        return freeze<Array<ClubReservationOverview>>(bookings.map(booking => {
            const times = _.mapValues({
                endDateTime: booking.end,
                startDateTime: booking.start
            }, dateTime => {
                const [dateString, timeString] = dateTime.split(/\s+/),
                    [year, month, date] = dateString.split("-").map(value => parseInt(value, 10)),
                    [hour, minute, second] = timeString.split(":").map(value => parseInt(value, 10));
                return DateTime.local(year, month, date, hour, minute, second, 0, {zone: session.loginResponse.timezone});
            });
            return {
                id: parseInt(booking.id, 10),
                time: Interval.fromDateTimes(times.startDateTime, times.endDateTime),
                aircraftId
            };
        }));
    }

    /**
     * Parse a `./functions/aircraft/getClubAircrafts.php` response.
     *
     * @param session the session.
     * @param root the response document.
     */
    parseGetClubAircrafts(session: AircraftClubsSession, root: ParentNode) {
        const table = root.querySelector<HTMLTableElement>("#aircraftTable")!,
            rowDataCells = tableRowDataCells(table);
        return freeze<GetClubAircraftsResponse>(rowDataCells.map(data => {
            const {
                ["Unique ID"]: aircraftId,
                ["Tail Number"]: tailNumber,
                ["Aircraft Type"]: model,
                ["Description"]: description
            } = _.mapValues(data, extractText);
            return {
                id: parseInt(aircraftId, 10),
                description, model, tailNumber
            };
        }), true);
    }

    /**
     * Parse a `./functions/booking/getUpcomingBookings.php` response.
     *
     * @param session the session.
     * @param root the response document.
     */
    parseGetUpcomingBookings(session: AircraftClubsSession, root: ParentNode) {
        const table = root.querySelector<HTMLTableElement>("#bookingTable")!,
            rowDataCells = tableRowDataCells(table);
        return freeze<Array<AircraftClubsBooking>>(rowDataCells.map(data => {
            const {
                    ["Booking ID"]: bookingId,
                    ["Date Internal"]: fromDateTimeEpochSecs,
                    ["To Date"]: toDateTimeString,
                    ["Aircraft"]: aircraft
                } = _.mapValues(data, extractText),
                startDateTime = new Date(1000 * Number(fromDateTimeEpochSecs)),
                [toDate, toTime] = toDateTimeString.split(",").map(_.trim);
            return {
                id: parseInt(bookingId, 10),
                personId: parseInt(session.loginResponse.personID, 10),
                endDateTime: this.parseDateTime(session, toDate, toTime),
                tailNumber: aircraft,
                startDateTime
            };
        }), true);
    }

    /**
     * Parse a `./functions/booking/getMakeBookingForm.php` response.
     *
     * @param session the session.
     * @param root the response document.
     */
    parseGetMakeBookingForm(session: AircraftClubsSession, root: ParentNode) {
        const form = root.querySelector<HTMLFormElement>("#newBookingForm")!,
            elements = formDataElements(form),

            /* Elements whose values are assigned directly in HTML. */
            staticNamesAndValues = _.transform(elements, (bookings, [{name}, valueElement]) => {
                bookings.push([name, valueElement?.value || null]);
            }, Array<[string, string | null]>()),

            /* Elements whose values are assigned in the $.ready() script. */
            scripts = _.toArray(root.querySelectorAll<HTMLScriptElement>("script"))
                .filter(({src}) => !src),
            scriptedNamesAndValues = _.transform(scripts, (vals, {innerHTML: script}) => {
                jQueryValExtractor.execute(script)
                    .map(([selector, value]) => {
                        const element = root.querySelector(selector)!;
                        if ("name" in element) {
                            vals.push([String(element.name), value]);
                        }
                    });
            }, new Array<[string, string | null]>());

        /* Merge HTML and scripted values and parse. */
        const allValues = Object.assign(Object.fromEntries(staticNamesAndValues),
            Object.fromEntries(scriptedNamesAndValues)) as Dictionary<string | null>;
        return freeze<AircraftClubsBookingDetail>({
            id: parseInt(allValues["bookingID"]!),
            aircraftId: parseInt(allValues["bookingAircraftSelect"]!),
            personId: parseInt(allValues["personID"]!),
            backup: "0" !== allValues["backupStatus"],
            comments: allValues["comments"],
            destination: allValues["destination"],
            endDateTime: this.parseDateTime(session, allValues["toDate"]!,
                `${allValues["toHours"]}:${allValues["toMins"]}`),
            maintenance: "0" !== allValues["isMaintenance"],
            shared: "2" === allValues["shareType"],
            startDateTime: this.parseDateTime(session, allValues["fromDate"]!,
                `${allValues["fromHours"]}:${allValues["fromMins"]}`)
        });
    }

    parseGetMaintenanceItems(session: AircraftClubsSession, root: ParentNode) {
        const table = root.querySelector<HTMLTableElement>("#maintenanceTable")!,
            rowDataCells = tableRowDataCells(table);
        return freeze<GetMaintenanceItemsResponse>(rowDataCells.map(data => {
            const htmlValues = _.mapValues(data, extractText);

            /* Simple values. */
            const allValues: Dictionary<any> = {};
            _.transform({
                id: "ID",
                description: "Maintenance",
                frequency: "Frequency",
                performedTach: "Last Maintenance Tach",
                dueTach: "Tach When Next Due"
            }, (values, name, key) => {
                const value = htmlValues[name];
                if ("N/A" !== value) {
                    values[key] = htmlValues[name];
                }
            }, allValues);

            /* Date values. */
            _.transform({
                performedDate: "Last Maintenance Date",
                dueDate: "Date When Next Due"
            }, (values, name, key) => {
                values[key] = this.parseDateToIsoString(session, htmlValues[name]);
            }, allValues);
            return {
                id: parseInt(allValues["id"]!, 10),
                description: allValues["description"]!,
                frequency: (([interval, ...rest]) => ({
                    interval: parseInt(interval, 10),
                    unit: "hours" === rest.pop() ? "hour" : "month"
                }))(allValues["frequency"].split(/\s+/).slice(1)),
                due: allValues["dueTach"] ? {
                    hours: Number(allValues["dueTach"])
                } : {
                    date: allValues["dueDate"]
                },
                performed: {
                    date: allValues["performedDate"],
                    hours: Number(allValues["performedTach"]) || null
                }
            };
        }));
    }

    parseGetMember(session: AircraftClubsSession, root: ParentNode) {

        /* Accumulate key/value pairs from static HTML. First, simple pairs from 'form-group' divs. */
        const allValues: Dictionary<any> = {};
        _.transform(_.toArray(root.querySelectorAll("div.form-group")), (acc, group) => {
            const label = group.querySelector("label.control-label");
            if (null != label) {
                const key = label.textContent!.trim().replace(/:$/g, ""),
                    formValue = group.querySelector(".form-control");
                if (null == formValue) {
                    const staticValue = group.querySelector("p.form-control-static");
                    if (null != staticValue && "I" !== staticValue.firstChild?.nodeName) {
                        const value = staticValue.textContent!.trim();
                        if (value) {
                            acc[key] = value;
                        }
                    }
                } else if (isHTMLInputElement(formValue)) {
                    const value = formValue.value.trim();
                    if (value) {
                        acc[key] = value;
                    }
                } else if (isHTMLTextAreaElement(formValue)) {
                    const value = formValue.textContent!.trim();
                    if (value) {
                        acc[key] = value;
                    }
                } else if (isHTMLSelectElement(formValue)) {
                    const selectedOption = formValue.querySelector("option[selected]");
                    if (null != selectedOption) {
                        const value = selectedOption.textContent!.trim();
                        if (value) {
                            acc[key] = value;
                        }
                    }
                } else {
                    throw Error(`Unsupported element [${formValue.tagName}].`);
                }
            }
        }, allValues);

        /* Normalize dates and times to ISO format. */
        _.transform(["Date of Birth", "Certificate Date", "Club Review", "BFR", "Medical Certificate", "Last Accessed"],
            (acc, key) => {
                const value = acc[key];
                if (value) {
                    const parts = value.split(",").map(_.trim);
                    if (1 === parts.length) {
                        acc[key] = this.parseDateToIsoString(session, value);
                    } else {
                        acc[key] = this.parseDateTime(session, parts[0], parts[1]).toISOString();
                    }
                }
            }, allValues);

        /* Remove non-digits from phone numbers. */
        _.transform(["Emergency Phone", "Home Phone", "Mobile Phone", "Work Phone"], (acc, key) => {
            const value = acc[key];
            if (value) {
                acc[key] = value.replace(/\D/g, "");
            }
        }, allValues);

        /* Scripted values. */
        const scripts = _.toArray(root.querySelectorAll<HTMLScriptElement>("script"))
            .filter(({src}) => !src);
        _.transform(scripts, (values, scriptElement) => {
            jQueryValExtractor.execute(scriptElement.innerHTML)
                .map(([selector, value]) => {
                    const element = root.querySelector(selector);
                    if (isHTMLSelectElement(element)) {
                        const {name} = element;
                        values[name] = value;
                    } else if (isHTMLInputElement(element)) {
                        const {name, type} = element;
                        if ("checkbox" === type) {
                            values[name] = !!value;
                        } else {
                            values[name] = value;
                        }
                    }
                })
        }, allValues);

        /* Allowed aircraft. */
        const allowedAircraftIds = Object.keys(allValues)
            .filter(key => 0 === key.indexOf("aircraft_"))
            .map(key => parseInt(key.split("_").pop()!, 10));

        /* "Reservation cancellation, flight sharing, and early return emails." Note that these appear to start out as
        checked and then are unchecked as appropriate in script. */
        const emailAircraftIds = _.toArray(root.querySelectorAll<HTMLInputElement>("input.aircraftMail[checked]"))
            .map(({value}) => parseInt(value, 10))
            .filter(id => false !== allValues[`aircraftemail_${id}`]);

        /* "Reservation activity notifications". */
        const notifyAircraftIds = _.toArray(root.querySelectorAll<HTMLInputElement>("input.aircraftNotifyMail[checked]"))
            .map(({value}) => parseInt(value, 10));

        /* Default aircraft. */
        const defaultAircraftIdElement = root.querySelector<HTMLOptionElement>("#aircraftSelect option[selected]"),
            defaultAircraftId = null == defaultAircraftIdElement ? null : parseInt(defaultAircraftIdElement.value, 10);

        /* Parse the member ID from the form action and return the member record. */
        const {action} = root.querySelector<HTMLFormElement>("#updateMemberForm")!,
            state = root.querySelector("#stateSelection")!.textContent!.trim();
        return freeze<GetMemberResponse>({
            id: parseInt(new URLSearchParams(action.split("?")[1]).get("id")!, 10),
            address: {
                street: allValues["Street"]!,
                street2: null,
                postalCode: allValues["Postal/Zip Code"]!,
                city: allValues["City"]!,
                country: allValues["Country"]!,
                state
            },
            aircraft: allowedAircraftIds.map(id => ({
                id: id,
                preferred: id === defaultAircraftId,
                selected: id === defaultAircraftId
                    || -1 !== emailAircraftIds.indexOf(id)
                    || -1 !== notifyAircraftIds.indexOf(id)
            })),
            certificate: !allValues["Certificate Date"] ? null : {
                issueDate: allValues["Certificate Date"],
                number: allValues["Certificate Number"]!
            },
            clubReviewDueDate: allValues["Club Review"],
            displayName: toDisplayName(allValues["First Name"], allValues["Last Name"]),
            emergencyContact: !allValues["Emergency Contact"] ? null : {
                name: allValues["Emergency Contact"],
                phone: allValues["Emergency Phone"]!
            },
            emailAddresses: ["Email Address", "2nd Email Address", "3rd Email Address"]
                .filter(key => key in allValues)
                .map(key => allValues[key]!),
            firstName: allValues["First Name"]!,
            lastAccessDateTime: !allValues["Last Accessed"] ? null : new Date(allValues["Last Accessed"]),
            lastName: allValues["Last Name"],
            medicalCertificate: !allValues["Medical Certificate"] ? null : {
                dueDate: allValues["Medical Certificate"]
            },
            memberships: !allValues["AOPA Number"] ? [] : [{
                type: "aopa",
                number: allValues["AOPA Number"]
            }],
            phoneNumbers: [["Home Phone", "home"], ["Mobile Phone", "mobile"], ["Work Phone", "work"]]
                .filter(([key]) => key in allValues)
                .map(([key, type]) => ({
                    number: allValues[key]!,
                    type: type as PhoneNumberType
                })),
            flightReviewDueDate: allValues["BFR"]
        }, true);
    }

    /**
     * Parse a `./functions/member/getMembers.php` response.
     *
     * @param session the session.
     * @param root the response document.
     */
    parseGetMembers(session: AircraftClubsSession, root: ParentNode) {
        const table = root.querySelector<HTMLTableElement>("#memberTable")!,
            rowDataCells = tableRowDataCells(table);
        return freeze<GetMembersResponse>(rowDataCells.map(data => {
            const {
                ["Unique ID"]: memberId,
                ["Name"]: fullName,
                ["Email"]: email,
                ["Mobile"]: mobile,
                ["StatusID"]: statusId
            } = _.mapValues(data, extractText);
            let status: GetMembersResponseItem["status"];
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

    parseGetSquawkLog(session: AircraftClubsSession, root: ParentNode) {
        const table = root.querySelector<HTMLTableElement>("#squawkTable")!,
            rowDataCells = tableRowDataCells(table);
        return freeze<GetSquawkLogResponse>(rowDataCells.map(data => {
            const htmlValues = _.mapValues(data, extractText);

            /* Simple values. */
            const allValues: Dictionary<any> = {};
            _.transform({
                id: "ID Number",
                description: "Description",
                timestamp: "TS"
            }, (values, name, key) => {
                values[key] = htmlValues[name];
            }, allValues);

            /* Date values. */
            _.transform({
                date: "Ocurrence Date"
            }, (values, name, key) => {
                values[key] = this.parseDateToIsoString(session, htmlValues[name]);
            }, allValues);
            return {
                id: parseInt(allValues["id"]!.split("-").pop(), 10),
                description: allValues["description"]!,
                timestamp: new Date(Number(allValues["timestamp"]!) * 1000),
                date: allValues["date"]
            };
        }));
    }

    /**
     * Parse date and time strings according to the formats identified by a session.
     *
     * @param session the session with time format information.
     * @param date the date string.
     * @param time the time string.
     * @private
     */
    private parseDateTime(session: AircraftClubsSession, date: string, time: string) {
        const {loginResponse} = session,
            twelveHour = loginResponse.JSTimeFormat.startsWith("h"),
            [hourString, minuteAndMaybeMeridian] = time.toLowerCase().split(":"),
            minute = parseInt(minuteAndMaybeMeridian, 10),
            meridian = twelveHour && 1 !== minuteAndMaybeMeridian.indexOf("p") ? 12 : 0,
            hour = parseInt(hourString, 10) + meridian,
            {month, day, year} = this.parseDate(session, date);
        return DateTime.local(year, month, day, hour, minute, 0, 0, {zone: loginResponse.timezone})
            .toJSDate();
    }

    /**
     * Parse a date string according to the format identified by a session.
     *
     * @param session the session with time format information.
     * @param date the date string.
     * @private
     */
    private parseDate(session: AircraftClubsSession, date: string) {
        const order = _.uniq(session.loginResponse.JSDateFormat),
            sep = _.min(order)!,
            symbols = _.without(order, sep),
            dateElements = date.split(sep),
            [year, month, day] = ["y", "m", "d"]
                .map(symbol => parseInt(dateElements[symbols.indexOf(symbol)], 10));
        return {
            month: month,
            day, year
        };
    }

    private parseDateToIsoString(session: AircraftClubsSession, date: string) {
        const {year, month, day} = this.parseDate(session, date);
        return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }

    /**
     * Singleton instance.
     */
    static INSTANCE = freeze(new AircraftClubsResponseParser());
}

/**
 * Single row of data cells extracted from a table. Cells are keyed on *name*, which is the text content of the
 * corresponding `th` node in the table header.
 */
type TableRowDataCells = {
    [name in string]: HTMLTableDataCellElement
};

/**
 * Extract all text from a `node` and all of its children into a single, joined string.
 *
 * @param node the node.
 */
function extractText(node: Node) {
    return _.toArray(node.childNodes)
        .filter(({nodeType}) => 3 === nodeType)
        .map(({textContent}) => textContent!)
        .filter(text => !!text)
        .join(" ")
        .replace(/\s{2,}/g, " ");
}

/**
 * Extract all form elements and their associated value elements. In all cases except `<select .../>`, the form and
 * value elements are the same. For a select element, the value element is the selected `<option .../>` element, if
 * any (else `null`.)
 *
 * @param form the form whose elements are to be extracted.
 */
function formDataElements(form: HTMLFormElement) {
    const elements = form.querySelectorAll<FormElement>("[name]")!;
    return _.transform(_.toArray(elements), (elements, element) => {
        if (!isHTMLSelectElement(element)) {
            elements.push([element, element]);
        } else {
            const selected = element.querySelector<HTMLOptionElement>("option[selected]") || null;
            elements.push([element, selected]);
        }
    }, [...EMPTY_ELEMENT_VALUES]);
}

/**
 * Parse a table into an array of {@link TableRowDataCells} objects.
 *
 * @param table the table whose rows are to be extracted.
 */
function tableRowDataCells(table: HTMLTableElement) {
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

/**
 * Empty {@link TableRowDataCells} instance.
 */
const EMPTY_ROW_DATA = freeze<TableRowDataCells>({});

/**
 * Empty array of form value tuples.
 */
const EMPTY_ELEMENT_VALUES = freeze<Array<[FormElement, null | FormValueElement]>>([]);

function isHTMLInputElement(value: any): value is HTMLInputElement {
    return _.isObject(value)
        && "tagName" in value
        && "INPUT" === value.tagName;
}

function isHTMLOptionElement(value: any): value is HTMLOptionElement {
    return _.isObject(value)
        && "tagName" in value
        && "OPTION" === value.tagName;
}

function isHTMLSelectElement(value: any): value is HTMLSelectElement {
    return _.isObject(value)
        && "tagName" in value
        && "SELECT" === value.tagName;
}

function isHTMLTextAreaElement(value: any): value is HTMLTextAreaElement {
    return _.isObject(value)
        && "tagName" in value
        && "TEXTAREA" === value.tagName;
}

/**
 * Extractor for form fields which are initialized dynamically via jQuery in the document ready handler.
 */
const jQueryValExtractor = JsExtractor.create<[string, string]>([
    {
        /* Invoke the $() callback. */
        path: ["$"],
        extract: context => {
            const {args: [onReady]} = _.findLast(context, isMethodInvocation)!;
            if (_.isFunction(onReady)) {
                onReady();
            }
        }
    }, {
        /* Invoke the $.ready() callback. */
        path: ["$", "ready"],
        extract: context => {
            const {args: [onReady]} = _.findLast(context, isMethodInvocation)!;
            onReady();
        }
    }, {
        /* Capture $("abc").val("xyz") to ["abc", "xyz"]. */
        path: ["$", "val"],
        extract: context => {
            const args = context.filter(isMethodInvocation)
                .map(({args}) => args);
            if (!_.isEmpty(_.last(args))) {
                const [[key], [value]] = args;
                return [[key, value]];
            }
        }
    }, {
        /* Capture $("abc").attr("name", "value") to ["abc", "value"]. */
        path: ["$", "attr"],
        extract: context => {
            const args = context.filter(isMethodInvocation)
                .map(({args}) => args);
            if (!_.isEmpty(_.last(args))) {
                const [[key], [value]] = args;
                return [[key, value]];
            }
        }
    }, {
        /* Capture $("selector").prop("name", "value") to ["selector", "name", "value"]. */
        path: ["$", "prop"],
        extract: context => {
            const args = context.filter(isMethodInvocation)
                .map(({args}) => args);
            if (!_.isEmpty(_.last(args))) {
                const [[key], [, prop]] = args;
                return [[key, prop]];
            }
        }
    }
]);

const jQueryAjaxDataExtractor = JsExtractor.create<Dictionary<any>>([
    {
        path: ["$", "ajax"],
        extract: context => {
            const top = _.last(context);
            if (isMethodInvocation(top)) {
                const {args: [arg]} = top;
                if ("data" in arg) {
                    return [arg["data"]];
                }
            }
        }
    }
]);

function toDisplayName(...names: Array<null | undefined | string>) {
    const trimmed = names.filter(name => null != name)
        .map(name => name!.trim());
    if (1 === trimmed.length) {
        return trimmed[0];
    }
    return `${trimmed[0]} ${trimmed[1].substring(0, 1).toUpperCase()}`;
}

type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FormValueElement = HTMLInputElement | HTMLTextAreaElement | HTMLOptionElement;
