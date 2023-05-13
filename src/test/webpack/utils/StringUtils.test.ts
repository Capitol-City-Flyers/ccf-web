import {iterateRecords} from "../../../main/webpack/utils/StringUtils";
import _ from "lodash";

describe("StringUtils", () => {
    describe("iterateRecords()", () => {
        test("Single empty element", () => {
            expect(_.toArray(iterateRecords("", /\|/))).toStrictEqual([""]);
        });
        test("Single non-empty element", () => {
            expect(_.toArray(iterateRecords("abc", /\|/))).toStrictEqual(["abc"]);
        });
        test("Multiple non-empty elements", () => {
            expect(_.toArray(iterateRecords("abc|def|ghi", /\|/)))
                .toStrictEqual(["abc", "|def", "|ghi"]);
        });
        test("Multiple empty elements", () => {
            expect(_.toArray(iterateRecords("||", /\|/))).toStrictEqual(["", "|", "|"]);
        });
    });
});
