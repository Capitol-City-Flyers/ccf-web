import {Windowed, windowed, Token, tokenize} from "../../../main/webpack/utils/TokenizeUtils";

describe("TokenizeUtils", () => {
    describe("windowed()", () => {
        test("No look-ahead or look-behind", () => {
            const chunks = new Array<Windowed<string>>()
            for (let chunk of windowed(["a", "b", "c"], {lookAhead: 0, lookBehind: 0})) {
                chunks.push(chunk);
            }
            expect(chunks).toStrictEqual([
                {ahead: [], behind: [], current: "a"},
                {ahead: [], behind: [], current: "b"},
                {ahead: [], behind: [], current: "c"},
            ]);
        });
        test("Look-ahead and look-behind", () => {
            const chunks = new Array<Windowed<string>>()
            for (let chunk of windowed(["a", "b", "c"], {lookAhead: 1, lookBehind: 1})) {
                chunks.push(chunk);
            }
            expect(chunks).toStrictEqual([
                {ahead: ["b"], behind: [], current: "a", next: "b"},
                {ahead: ["c"], behind: ["a"], current: "b", next: "c", previous: "a"},
                {ahead: [], behind: ["b"], current: "c", previous: "b"},
            ]);
        });
    });
    describe("tokenize()", () => {
        describe("Emit end token", () => {
            test("Empty input", () => {
                const tokens = new Array<Token>();
                for (let token of tokenize("", {emitEnd: true})) {
                    tokens.push(token);
                }
                expect(tokens).toStrictEqual([{kind: "end"}]);
            });
            test("Non-empty input", () => {
                const tokens = new Array<Token>();
                for (let token of tokenize("\r\n", {emitEnd: true, emitNewline: true})) {
                    tokens.push(token);
                }
                expect(tokens).toStrictEqual([{kind: "newline"}, {kind: "end"}]);
            });
        });
        test("Emit neither newline nor whitespace", () => {
            const tokens = new Array<Token>();
            for (let token of tokenize("this is\nonly \n \na test.")) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([
                {kind: "text", value: "this"},
                {kind: "text", value: "is"},
                {kind: "text", value: "only"},
                {kind: "text", value: "a"},
                {kind: "text", value: "test."}
            ]);
        });
        test("Emit newline only", () => {
            const tokens = new Array<Token>();
            for (let token of tokenize("\n\r\n  this is\nonly \n \na test.\n\n", {emitNewline: true})) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([
                {kind: "newline"},
                {kind: "newline"},
                {kind: "text", value: "this"},
                {kind: "text", value: "is"},
                {kind: "newline"},
                {kind: "text", value: "only"},
                {kind: "newline"},
                {kind: "newline"},
                {kind: "text", value: "a"},
                {kind: "text", value: "test."},
                {kind: "newline"},
                {kind: "newline"}
            ]);
        });
        test("Emit newline and whitespace", () => {
            const tokens = new Array<Token>();
            for (let token of tokenize("\n\r\n  this is\nonly \n \na test.\n\n", {
                emitNewline: true,
                emitWhitespace: true
            })) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([
                {kind: "newline"},
                {kind: "newline"},
                {kind: "whitespace"},
                {kind: "text", value: "this"},
                {kind: "whitespace"},
                {kind: "text", value: "is"},
                {kind: "newline"},
                {kind: "text", value: "only"},
                {kind: "whitespace"},
                {kind: "newline"},
                {kind: "whitespace"},
                {kind: "newline"},
                {kind: "text", value: "a"},
                {kind: "whitespace"},
                {kind: "text", value: "test."},
                {kind: "newline"},
                {kind: "newline"}
            ]);
        });
        test("Include whitespace only", () => {
            const tokens = new Array<Token>();
            for (let token of tokenize("\n\r\n  this is\nonly \n \na test.\n\n", {emitWhitespace: true})) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([
                {kind: "whitespace"},
                {kind: "text", value: "this"},
                {kind: "whitespace"},
                {kind: "text", value: "is"},
                {kind: "text", value: "only"},
                {kind: "whitespace"},
                {kind: "whitespace"},
                {kind: "text", value: "a"},
                {kind: "whitespace"},
                {kind: "text", value: "test."}
            ]);
        });
        test("No tokens", () => {
            for (let token of tokenize("")) {
                expect(true).toBe(false);
            }
        });
        test("Single token", () => {
            const tokens = new Array<Token>();
            for (let token of tokenize("text!!!")) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([{kind: "text", value: "text!!!"}]);
        });
    });
});
