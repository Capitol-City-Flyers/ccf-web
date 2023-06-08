import {percent, scale} from "../../src/utilities/math-utils";

describe("math-utils.ts", () => {
    describe("percent()", () => {
        test("Default scale (2)", () => {
            expect(percent(0)).toStrictEqual(0);
            expect(percent(0.66667)).toStrictEqual(66.67);
            expect(percent(1)).toStrictEqual(100);
        });
        test("Custom scale", () => {
            expect(percent(0)).toStrictEqual(0);
            expect(percent(0.66666, 1)).toStrictEqual(66.7);
            expect(percent(1)).toStrictEqual(100);
        });
    });
    describe("scale()", () => {
        test("For decimal digits < 0", () => {
            expect(() => scale(123, -1)).toThrow(Error);
        });
        test("For zero decimal digits", () => {
            expect(scale(123.1, 0)).toBe(123);
            expect(scale(123.5, 0)).toBe(124);
        });
        test("For one decimal digit", () => {
            expect(scale(123.01, 1)).toBe(123);
            expect(scale(123.05, 1)).toBe(123.1);
        });
    });
});
