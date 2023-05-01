import {createHash} from "crypto";
import {JSDOM} from "jsdom";
import _ from "lodash";
import {decryptTextResource} from "../../../utils/TestDataUtils";
import {
    AircraftClubsResponseParser
} from "../../../../../main/webpack/integrations/aircraftclubs/AircraftClubsResponseParser";
import {AircraftClubsSession} from "../../../../../main/webpack/components/auth/aircraftclubs/AircraftClubsSession";
import {
    GetBookingsForCalendarResponse
} from "../../../../../main/webpack/integrations/aircraftclubs/AircraftClubsResponseTypes";
import {DateCalc} from "../../../../../main/webpack/utils/DateCalc";

describe("AircraftClubsResponseParser", () => {
    const instance = new AircraftClubsResponseParser(),
        session = {
            loginResponse: {
                JSDateFormat: "mm/dd/yyyy",
                JSTimeFormat: "H:ii",
                personID: "123",
                timezone: "America/Chicago"
            }
        } as AircraftClubsSession;
    describe("Parses test data files correctly", () => {
        test("parseGetAddSquawkDialog", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getAddSquawkDialog.html.enc"));
            expect(instance.parseGetAddSquawkDialog(session, doc))
                .toStrictEqual({
                    id: 25320,
                    aircraftId: 680,
                    memberId: 34263,
                    comments: null,
                    date: "2023-01-09",
                    description: "Couple minor bugs to note after avionics work: 1) Pitot heat off annunciation no longer triggers when ground testing it. Tried twice, pitot heat works, it just doesn't annunciate. 2) New backup instrument is a bit cockeyed in the panel as Peter has mentioned, but it seems to be accurate except 3) heading on the backup instrument seems to be subject to some magnetic interference. I saw it off by as much as 30 degrees in flight. Just stuff to be aware of for a while. Note discrepancy in the image file: compass showed 90 (correct) backup inst showed 112. It wasn't always that far off.",
                    ground: false,
                    status: "open",
                    attachmentIds: [36170]
                });
        });
        test("parseGetAircraft", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getAircraft.html.enc"));
            expect(instance.parseGetAircraft(session, doc)).toEqual({
                id: 680,
                tailNumber: "N569DS",
                airframe: {
                    model: "DA40/G",
                    year: 2006
                },
                billing: {
                    currency: "USD",
                    includesFuel: true,
                    rate: 144,
                    source: "tach",
                    unit: "hour"
                },
                description: "Diamond Star DA40\n" +
                    "Lycoming IO-360-M1A. Last overhaul 5/16/2019 at tach 2772.5.",
                equipment: "Garmin G1000\n" +
                    "GTX345R transponder with ADS-B In and Out\n" +
                    "GDL69 XM Weather Datalink\n" +
                    "ICAO Flight Plan Information:\n" +
                    "Aircraft Type: DA40\n" +
                    "Equipment: GRSZ/HB2\n" +
                    "Other Information: PBN/A1B2C2D2L1O2S1 CODE/A748B5\n" +
                    "\n" +
                    "Documentation: https://www.dropbox.com/home/CCF/Aircraft%20Documentation/N569DS",
                rules: "ifr",
                engine: "IO-360 180hp",
                location: null,
                reservationNotes: null
            });
        });
        test("parseGetBookingsForCalendar", async () => {
            const bookings: GetBookingsForCalendarResponse = JSON.parse(await decryptTextResource("./responses/aircraftclubs/getBookingsForCalendar.json.enc")),
                dates = DateCalc.create("America/Chicago");
            expect(instance.parseGetBookingsForCalendar(session, 680, bookings))
                .toStrictEqual([{
                    id: 2267349,
                    time: dates.toDateTime("2023-02-25T20:30:00.000Z")
                        .until(dates.toDateTime("2023-02-26T00:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2255948,
                    time: dates.toDateTime("2023-02-26T15:30:00.000Z")
                        .until(dates.toDateTime("2023-02-26T20:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2268753,
                    time: dates.toDateTime("2023-02-28T19:00:00.000Z")
                        .until(dates.toDateTime("2023-02-28T22:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2263681,
                    time: dates.toDateTime("2023-02-28T22:30:00.000Z")
                        .until(dates.toDateTime("2023-03-01T00:30:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2270314,
                    time: dates.toDateTime("2023-03-04T15:00:00.000Z")
                        .until(dates.toDateTime("2023-03-04T18:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2271223,
                    time: dates.toDateTime("2023-03-07T20:00:00.000Z")
                        .until(dates.toDateTime("2023-03-07T23:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2265685,
                    time: dates.toDateTime("2023-03-08T17:30:00.000Z")
                        .until(dates.toDateTime("2023-03-08T20:15:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2274845,
                    time: dates.toDateTime("2023-03-17T21:00:00.000Z")
                        .until(dates.toDateTime("2023-03-17T23:30:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2265686,
                    time: dates.toDateTime("2023-03-18T16:30:00.000Z")
                        .until(dates.toDateTime("2023-03-18T23:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2269062,
                    time: dates.toDateTime("2023-03-21T21:00:00.000Z")
                        .until(dates.toDateTime("2023-03-22T00:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2267771,
                    time: dates.toDateTime("2023-03-24T17:00:00.000Z")
                        .until(dates.toDateTime("2023-03-24T18:30:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2275536,
                    time: dates.toDateTime("2023-03-25T18:00:00.000Z")
                        .until(dates.toDateTime("2023-03-26T00:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2280133,
                    time: dates.toDateTime("2023-03-26T00:00:00.000Z")
                        .until(dates.toDateTime("2023-03-26T03:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2275535,
                    time: dates.toDateTime("2023-03-26T13:00:00.000Z")
                        .until(dates.toDateTime("2023-03-26T22:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2275534,
                    time: dates.toDateTime("2023-03-27T13:00:00.000Z")
                        .until(dates.toDateTime("2023-03-27T22:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2275533,
                    time: dates.toDateTime("2023-03-28T13:00:00.000Z")
                        .until(dates.toDateTime("2023-03-28T22:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2275531,
                    time: dates.toDateTime("2023-03-29T13:00:00.000Z")
                        .until(dates.toDateTime("2023-03-30T22:00:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2282758,
                    time: dates.toDateTime("2023-04-02T17:00:00.000Z")
                        .until(dates.toDateTime("2023-04-02T20:30:00.000Z")),
                    aircraftId: 680
                }, {
                    id: 2270304,
                    time: dates.toDateTime("2023-04-03T14:00:00.000Z")
                        .until(dates.toDateTime("2023-04-14T23:00:00.000Z")),
                    aircraftId: 680
                }]);
        });
        test("parseGetClubAircrafts", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getClubAircrafts.html.enc"));
            expect(instance.parseGetClubAircrafts(session, doc))
                .toStrictEqual([{
                    description: "Cessna R182 (182RG) Engine: Lycoming O-540-J3C5D. Last overhaul 3/13/2018 at tach 984.6.",
                    id: 679,
                    model: "R182/G",
                    tailNumber: "N271RG"
                }, {
                    description: "Diamond Star DA40 Lycoming IO-360-M1A. Last overhaul 5/16/2019 at tach 2772.5.",
                    id: 680,
                    model: "DA40/G",
                    tailNumber: "N569DS"
                }, {
                    description: "Piper Archer Lycoming O-360-A4M. Last overhaul 2/1/2016 at tach -4.12 (yes, it's negative. To get TSMOH, *add* 4.12 to current tach time.)",
                    id: 678,
                    model: "PA-28-181/G",
                    tailNumber: "N8113B"
                }]);
        });
        test("parseGetMaintenanceItems", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getMaintenanceItems.html.enc"));
            expect(instance.parseGetMaintenanceItems(session, doc))
                .toStrictEqual([
                    {
                        id: 284,
                        description: "Annual Inspection",
                        frequency: {interval: 12, unit: "month"},
                        due: {date: "2023-04-30"},
                        performed: {date: "2022-04-01", hours: 3697.9}
                    },
                    {
                        id: 308,
                        description: "Oil Change",
                        frequency: {interval: 50, unit: "hour"},
                        due: {hours: 4032.9},
                        performed: {date: "2023-03-14", hours: 3982.9}
                    },
                    {
                        id: 553,
                        description: "AD 11-26-04 Lycoming Fuel Injection Line Inspection",
                        frequency: {interval: 100, unit: "hour"},
                        due: {hours: 4029.2},
                        performed: {date: "2022-10-19", hours: 3929.2}
                    },
                    {
                        id: 554,
                        description: "Static System Check",
                        frequency: {interval: 24, unit: "month"},
                        due: {date: "2023-05-31"},
                        performed: {date: "2021-05-21", hours: null}
                    },
                    {
                        id: 555,
                        description: "Transponder Check",
                        frequency: {interval: 24, unit: "month"},
                        due: {date: "2023-05-31"},
                        performed: {date: "2021-05-21", hours: null}
                    },
                    {
                        id: 1016,
                        description: 'Wings-off structural inspection',
                        frequency: {interval: 2000, unit: 'hour'},
                        due: {hours: 4104.5},
                        performed: {date: '2016-01-19', hours: 2104.5}
                    },
                    {
                        id: 2027,
                        description: 'Mag Rebuild',
                        frequency: {interval: 500, unit: 'hour'},
                        due: {hours: 3911.9},
                        performed: {date: '2021-05-21', hours: 3411.9}
                    },
                    {
                        id: 3298,
                        description: 'AD Nose Strut Inspection',
                        frequency: {interval: 100, unit: 'hour'},
                        due: {hours: 4029.2},
                        performed: {date: '2022-10-19', hours: 3929.2}
                    }
                ]);
        });
        test("parseGetMember", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getMember.html.enc")),
                member = instance.parseGetMember(session, doc),
                digest = createHash("sha256").update(JSON.stringify(member)).digest("hex");
            expect(digest).toEqual("ac25d4be04c004daa97823054d3189e7bf934b26820d0dd6ee4efc6233201d95");
        });
        test("parseGetMembers", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getMembers.html.enc")),
                members = _.sortBy(instance.parseGetMembers(session, doc), "id"),
                digest = _.transform(members, (hash, next) => {
                    hash.update(JSON.stringify(next));
                }, createHash("sha256")).digest("hex");
            expect(digest).toEqual("7aece6b46a3034acb894202d96ef97af584e9625f969b3cfd961284feba45d4a");
        });
        test("parseGetUpcomingBookings", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getUpcomingBookings.html.enc"));
            expect(instance.parseGetUpcomingBookings(session, doc))
                .toStrictEqual([{
                    id: 2260712,
                    personId: 123,
                    startDateTime: new Date("2023-07-02T14:00:00Z"),
                    endDateTime: new Date("2023-07-09T17:00:00Z"),
                    tailNumber: "N569DS"
                }]);
        });
        test("parseMakeBookingForm", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getMakeBookingForm.html.enc"));
            expect(instance.parseGetMakeBookingForm(session, doc))
                .toStrictEqual({
                    id: 2269062,
                    aircraftId: 680,
                    personId: 34263,
                    backup: false,
                    comments: "Vfr tbd",
                    destination: null,
                    endDateTime: new Date("2023-03-22T00:00:00Z"),
                    maintenance: false,
                    shared: false,
                    startDateTime: new Date("2023-03-21T21:00:00Z")
                });
        });
        test("parseGetSquawkLog", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getSquawkLog.html.enc"));
            expect(instance.parseGetSquawkLog(session, doc))
                .toStrictEqual([{
                    id: 5090,
                    description: "Hairline cracks noted on top surface of left wing near wing root. Appeared to be only crack in paint, not structural on underside. I marked cracks beginning and end with marker. Cracks did not lengthen on a 3.5 hour flight today at 7500 feet. Mild to no turbulence. Smaller hair size cracks noted on top of right wing root also.",
                    timestamp: new Date("2016-07-24T05:00:00.000Z"),
                    date: "2016-07-24"
                }, {
                    id: 6672,
                    description: "Rear door has delamination/composite damage underneath the gel coat. The area is 3-4\" in diameter on the window side near the window frame, about midway along the length of the door.",
                    timestamp: new Date("2017-03-17T05:00:00.000Z"),
                    date: "2017-03-17"
                }, {
                    id: 15564,
                    description: "Pilot side windshield defrost can't keep up as well as copilot side. Needs a lot of wiping off during flight. Suggest keeping a rag handy.",
                    timestamp: new Date("2020-01-06T06:00:00.000Z"),
                    date: "2020-01-06"
                }, {
                    id: 16743,
                    description: 'Loose screw on right side of canopy. I can hear it rolling around when I open and close it. ',
                    timestamp: new Date("2020-06-14T05:00:00.000Z"),
                    date: "2020-06-14"
                }, {
                    id: 23632,
                    description: 'Upper comm antenna is bent. Both Comms worked fine. ',
                    timestamp: new Date("2022-06-17T05:00:00.000Z"),
                    date: "2022-06-17"
                }, {
                    id: 24900,
                    description: `I had an in-flight "AHRS Aligning, Keep Wings Level" incident shortly after takeoff, all AHRS data red-X'ed (attitude and heading.) I was in VMC and it resolved after 15 seconds or so, so it was not a big problem, but in light of the current issues with the backup AI, the story could have been different in IMC. We should note any recurrence of this, it may have been a freak one-time thing, and perhaps hold off on taking it into IMC until the backup AI is replaced. Update 1/9/23: had two more of these today (post avionics work), but only near big blue.`,
                    timestamp: new Date("2022-11-10T06:00:00.000Z"),
                    date: "2022-11-10"
                }, {
                    id: 24902,
                    description: 'I experienced a failure to load AHRS on the PFD at startup and got red X’s. I restarted the G1000 two or three times and it finally loaded normally and was good the flight home. FYI particularly in light of the backup AI issues. This happened at Chicago Exec and the airplane was outside. The HSI loaded normally. I also experienced the backup AI not centering (stuck way off attitude) until I taxied the airplane to an area on the ramp for run up. Pulling the knob to cage did not work, but once the airplane moved on the ground the AI came alive. ',
                    timestamp: new Date("2022-10-27T05:00:00.000Z"),
                    date: "2022-10-27"
                }, {
                    id: 24930,
                    description: `We're down past one of the inner grooves at one particular spot on the left main tire. It's a stretch to call this a "flat spot," I think, it'll just be ready for replacement soonish.`,
                    timestamp: new Date("2022-11-13T06:00:00.000Z"),
                    date: "2022-11-13"
                }, {
                    id: 25320,
                    description: "Couple minor bugs to note after avionics work: 1) Pitot heat off annunciation no longer triggers when ground testing it. Tried twice, pitot heat works, it just doesn't annunciate. 2) New backup instrument is a bit cockeyed in the panel as Peter has mentioned, but it seems to be accurate except 3) heading on the backup instrument seems to be subject to some magnetic interference. I saw it off by as much as 30 degrees in flight. Just stuff to be aware of for a while. Note discrepancy in the image file: compass showed 90 (correct) backup inst showed 112. It wasn't always that far off.",
                    timestamp: new Date("2023-01-09T06:00:00.000Z"),
                    date: "2023-01-09"
                }, {
                    id: 25698,
                    description: 'During practice approach using autopilot airplane was only doing half standard rate turn. Flew through approach course.',
                    timestamp: new Date("2023-02-28T06:00:00.000Z"),
                    date: "2023-02-28"
                }]);
        });
    });
});
