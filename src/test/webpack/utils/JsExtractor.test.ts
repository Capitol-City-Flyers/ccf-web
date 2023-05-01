import {JSDOM} from "jsdom";
import _ from "lodash";
import {isMethodInvocation, JsExtractor} from "../../../main/webpack/utils/JsExtractor";
import {decryptTextResource} from "./TestDataUtils";

describe("JsExtractor", () => {
    describe("Extracts dynamically assigned values from AircraftClubs HTML documents", () => {
        const extractor = JsExtractor.create<[string, string | undefined]>([{
            path: ["$", "ready"],
            extract: context => {
                const ready = _.last(context);
                if (!isMethodInvocation(ready)) {
                    expect(true).toBe(false);
                    throw Error();
                }
                ready.args[0]();
            }
        }, {
            path: ["$", "val"],
            extract: context => {
                const args = context.filter(isMethodInvocation)
                    .map(({args}) => args);
                if (!_.isEmpty(_.last(args))) {
                    const [[key], [value]] = args;
                    return [[key, value]];
                }
            }
        }]);
        test("getMakeBookingForm.html", async () => {
            const doc = JSDOM.fragment(await decryptTextResource("./responses/aircraftclubs/getMakeBookingForm.html.enc")),
                scripts = _.toArray(doc.querySelectorAll("script")),
                extracted = _.transform(scripts, (extracted, script) => {
                    const source = script.innerHTML;
                    extracted.push(...extractor.execute(source));
                }, new Array<[string, string | undefined]>()),
                keysAndValues = Object.fromEntries(extracted);
            expect(keysAndValues).toEqual({
                "#fromHours": "16",
                "#fromMins": "00",
                "#toHours": "19",
                "#toMins": "00"
            });
        });
    });
});
