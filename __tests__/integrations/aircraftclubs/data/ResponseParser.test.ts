import {createHash} from "crypto";
import {JSDOM} from "jsdom";
import _ from "lodash";
import {decryptTextResource} from "../../../test-data-utils";
import {ResponseParser} from "../../../../src/integrations/aircraftclubs/session/ResponseParser";
import {
    GetBookingsForCalendarResponse,
    LoginSuccess
} from "../../../../src/integrations/aircraftclubs/aircraftclubs-types";
import {AircraftConfig} from "../../../../src/config-types";

describe("ResponseParser", () => {
    const instance = ResponseParser.create({
        JSDateFormat: "mm/dd/yyyy",
        JSTimeFormat: "H:ii",
        personID: "123",
        timezone: "America/Chicago"
    } as LoginSuccess);
    test("parseGetBookingsForCalendar", async () => {
        const bookings: GetBookingsForCalendarResponse = JSON.parse(await decryptTextResource("./integrations/aircraftclubs/data/getBookingsForCalendar.json.enc")),
            aircraft: AircraftConfig = {tailNumber: "N569DS", modeSCodeHex: "ABCDEF", refs: {aircraftClubs: "680"}};
        expect(instance.parseGetBookingsForCalendarResponse(bookings, aircraft))
            .toStrictEqual([{
                dateTimeRange: "2023-02-25T20:30:00.000Z/2023-02-26T00:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2267349"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-02-26T15:30:00.000Z/2023-02-26T20:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2255948"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-02-28T19:00:00.000Z/2023-02-28T22:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2268753"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-02-28T22:30:00.000Z/2023-03-01T00:30:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2263681"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-04T15:00:00.000Z/2023-03-04T18:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2270314"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-07T20:00:00.000Z/2023-03-07T23:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2271223"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-08T17:30:00.000Z/2023-03-08T20:15:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2265685"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-17T21:00:00.000Z/2023-03-17T23:30:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2274845"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-18T16:30:00.000Z/2023-03-18T23:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2265686"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-21T21:00:00.000Z/2023-03-22T00:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2269062"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-24T17:00:00.000Z/2023-03-24T18:30:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2267771"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-25T18:00:00.000Z/2023-03-26T00:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2275536"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-26T00:00:00.000Z/2023-03-26T03:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2280133"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-26T13:00:00.000Z/2023-03-26T22:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2275535"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-27T13:00:00.000Z/2023-03-27T22:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2275534"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-28T13:00:00.000Z/2023-03-28T22:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2275533"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-03-29T13:00:00.000Z/2023-03-30T22:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2275531"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-04-02T17:00:00.000Z/2023-04-02T20:30:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2282758"},
                tailNumber: "N569DS"
            }, {
                dateTimeRange: "2023-04-03T14:00:00.000Z/2023-04-14T23:00:00.000Z",
                kind: "aircraft",
                ref: {aircraftClubs: "2270304"},
                tailNumber: "N569DS"
            }]);
    });
    test("parseGetMembers", async () => {
        const doc = JSDOM.fragment(await decryptTextResource("./integrations/aircraftclubs/data/getMembers.html.enc")),
            members = _.sortBy(instance.parseGetMembers(doc), "id"),
            digest = _.transform(members, (hash, next) => {
                hash.update(JSON.stringify(next));
            }, createHash("sha256")).digest("hex");
        expect(digest).toEqual("7aece6b46a3034acb894202d96ef97af584e9625f969b3cfd961284feba45d4a");
    });
});
