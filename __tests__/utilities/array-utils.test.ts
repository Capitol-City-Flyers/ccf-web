import {flattenValues, validateIn} from "../../src/utilities/array-utils";

describe("array-utils.ts", () => {
    describe("flattenValues()", () => {
        test("for a single value", () => {
            expect(flattenValues("value1")).toStrictEqual(["value1"]);
        });
        test("for a single array with a single value", () => {
            expect(flattenValues(["value1"])).toStrictEqual(["value1"]);
        });
        test("for multiple single values", () => {
            expect(flattenValues("value1", "value2", "value3"))
                .toStrictEqual(["value1", "value2", "value3"]);
        });
        test("for multiple arrays of single values", () => {
            expect(flattenValues(["value1"], ["value2"], ["value3"]))
                .toStrictEqual(["value1", "value2", "value3"]);
        });
        test("for a mixture of single values and arrays of single values", () => {
            expect(flattenValues(["value1"], "value2", ["value3", "value4"]))
                .toStrictEqual(["value1", "value2", "value3", "value4"]);
        });
    });
    test("validateIn()", () => {
        const validate = validateIn([1], 2, [3], [4, 5]);
        expect(validate(0)).toBe(false);
        expect(validate(1)).toBe(true);
        expect(validate(2)).toBe(true);
        expect(validate(3)).toBe(true);
        expect(validate(4)).toBe(true);
        expect(validate(5)).toBe(true);
        expect(validate(6)).toBe(false);
    });
});
