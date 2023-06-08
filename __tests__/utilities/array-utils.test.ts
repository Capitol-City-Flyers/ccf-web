import {validateIn} from "../../src/utilities/array-utils";

describe("array-utils.ts", () => {
    test("validateIn()", () => {
        const validate = validateIn([1], 2, [3, [4, 5]]);
        expect(validate(0)).toBe(false);
        expect(validate(1)).toBe(true);
        expect(validate(2)).toBe(true);
        expect(validate(3)).toBe(true);
        expect(validate(4)).toBe(true);
        expect(validate(5)).toBe(true);
        expect(validate(6)).toBe(false);
    });
});