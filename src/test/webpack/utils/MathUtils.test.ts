import {toPercent} from "../../../main/webpack/utils/MathUtils";

describe("MathUtils", () => {
    describe("toPercent()", () => {
        test("Default scale (2)", () => {
            expect(toPercent(0)).toStrictEqual(0);
            expect(toPercent(0.66667)).toStrictEqual(66.67);
            expect(toPercent(1)).toStrictEqual(100);
        });
        test("Custom scale", () => {
            expect(toPercent(0)).toStrictEqual(0);
            expect(toPercent(0.66666, 1)).toStrictEqual(66.7);
            expect(toPercent(1)).toStrictEqual(100);
        });
    });
});
