import {TokenScanner} from "../../../main/webpack/utils/TokenScanner";

describe("TokenScanner", () => {
    test("constructor()", () => {
        const scanner = new TokenScanner(["a", "b", "c"]);
        expect(scanner.next()).toStrictEqual("a");
        expect(scanner.next()).toStrictEqual("b");
        expect(scanner.next()).toStrictEqual("c");
        expect(scanner.next()).toBeUndefined();
    });
    test("lookAhead()", () => {
        const scanner = new TokenScanner(["a", "b", "c"]);
        expect(scanner.lookAhead(0)).toStrictEqual([]);
        expect(scanner.lookAhead(1)).toStrictEqual(["a"]);
        expect(scanner.lookAhead(2)).toStrictEqual(["a", "b"]);
        expect(scanner.lookAhead(3)).toStrictEqual(["a", "b", "c"]);
        expect(scanner.lookAhead(4)).toStrictEqual(["a", "b", "c"]);
        expect(scanner.next()).toStrictEqual("a");
        expect(scanner.lookAhead(0)).toStrictEqual([]);
        expect(scanner.lookAhead(1)).toStrictEqual(["b"]);
        expect(scanner.lookAhead(2)).toStrictEqual(["b", "c"]);
        expect(scanner.lookAhead(3)).toStrictEqual(["b", "c"]);
        expect(scanner.next()).toStrictEqual("b");
        expect(scanner.lookAhead(0)).toStrictEqual([]);
        expect(scanner.lookAhead(1)).toStrictEqual(["c"]);
        expect(scanner.lookAhead(2)).toStrictEqual(["c"]);
        expect(scanner.next()).toStrictEqual("c");
        expect(scanner.lookAhead(0)).toStrictEqual([]);
        expect(scanner.lookAhead(1)).toStrictEqual([]);
        expect(scanner.next()).toBeUndefined();
    });
    test("lookBehind()", () => {
        const scanner = new TokenScanner(["a", "b", "c"], {lookBehindLimit: 2});
        try {
            scanner.lookBehind(3);
            expect(true).toBe(false);
        } catch (ex) {
            /* Good. */
        }
        expect(scanner.lookBehind(0)).toStrictEqual([]);
        expect(scanner.lookBehind(1)).toStrictEqual([]);
        expect(scanner.next()).toStrictEqual("a");
        expect(scanner.lookBehind(1)).toStrictEqual([]);
        expect(scanner.lookBehind(2)).toStrictEqual([]);
        expect(scanner.next()).toStrictEqual("b");
        expect(scanner.lookBehind(1)).toStrictEqual(["a"]);
        expect(scanner.lookBehind(2)).toStrictEqual(["a"]);
        expect(scanner.next()).toStrictEqual("c");
        expect(scanner.lookBehind(1)).toStrictEqual(["b"]);
        expect(scanner.lookBehind(2)).toStrictEqual(["b", "a"]);
        expect(scanner.next()).toBeUndefined();
        expect(scanner.lookBehind(1)).toStrictEqual(["c"]);
        expect(scanner.lookBehind(2)).toStrictEqual(["c", "b"]);
    });
    describe("next()", () => {
        test("Empty stream", () => {
            const scanner = new TokenScanner([]);
            expect(scanner.next()).toBeUndefined();
        });
        test("Non-empty stream", () => {
            const scanner = new TokenScanner(["a", "b", "c"]);
            expect(scanner.next()).toStrictEqual("a");
            expect(scanner.next()).toStrictEqual("b");
            expect(scanner.next()).toStrictEqual("c");
        });
    });
    test("peek()", () => {
        const scanner = new TokenScanner(["a", "b", "c"]);
        expect(scanner.peek()).toStrictEqual("a");
        expect(scanner.peek()).toStrictEqual("a");
        expect(scanner.next()).toStrictEqual("a");
        expect(scanner.peek()).toStrictEqual("b");
        expect(scanner.peek()).toStrictEqual("b");
        expect(scanner.next()).toStrictEqual("b");
        expect(scanner.peek()).toStrictEqual("c");
        expect(scanner.peek()).toStrictEqual("c");
        expect(scanner.next()).toStrictEqual("c");
        expect(scanner.peek()).toBeUndefined();
        expect(scanner.next()).toBeUndefined();
    });
    test("recall()", () => {
        const scanner = new TokenScanner(["a", "b", "c"]);
        expect(scanner.recall()).toBeUndefined();
        expect(scanner.next()).toStrictEqual("a");
        expect(scanner.recall()).toBeUndefined();
        expect(scanner.next()).toStrictEqual("b");
        expect(scanner.recall()).toStrictEqual("a");
        expect(scanner.next()).toStrictEqual("c");
        expect(scanner.recall()).toStrictEqual("b");
        expect(scanner.next()).toBeUndefined();
        expect(scanner.recall()).toStrictEqual("c");
    });
});
