import {TextTokenizer, Token} from "../../../main/webpack/utils/TextTokenizer";

describe("TextTokenizer", () => {
    describe("@@iterator()", () => {
        test("No tokens", () => {
            const instance = new TextTokenizer("");
            for (let token of instance) {
                expect(true).toBe(false);
            }
        });
        test("After consuming a token", () => {
            const instance = new TextTokenizer("a b"),
                tokens = new Array<Token>();
            expect(instance.next()).toStrictEqual({kind: "text", value: "a"});
            for (let token of instance) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([{kind: "text", value: "b"}]);
        });
        test("Before consuming tokens", () => {
            const instance = new TextTokenizer("a"),
                tokens = new Array<Token>();
            for (let token of instance) {
                tokens.push(token);
            }
            expect(tokens).toStrictEqual([{kind: "text", value: "a"}]);
        });
    });
    describe("iterator()", () => {
        test("No tokens", () => {
            const instance = new TextTokenizer("");
            expect(instance.iterator()()).toBeUndefined();
        });
        test("After consuming a token", () => {
            const instance = new TextTokenizer("a b"),
                iterator = instance.iterator();
            expect(instance.next()).toStrictEqual({kind: "text", value: "a"});
            expect(iterator()).toStrictEqual({kind: "text", value: "b"});
            expect(iterator()).toBeUndefined();
        });
        test("Before consuming tokens", () => {
            const instance = new TextTokenizer("a"),
                iterator = instance.iterator();
            expect(iterator()).toStrictEqual({kind: "text", value: "a"});
            expect(iterator()).toBeUndefined();
        });
    });
    describe("next()", () => {
        test("Include neither newline nor whitespace", () => {
            const instance = new TextTokenizer("this is\nonly \n \na test.")
            expect(instance.next()).toStrictEqual({kind: "text", value: "this"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "is"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "only"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "a"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "test."});
            expect(instance.next()).toBeUndefined();
        });
        test("Include newline only", () => {
            const instance = new TextTokenizer("\n\r\n  this is\nonly \n \na test.\n\n", {includeNewline: true})
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "this"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "is"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "only"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "a"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "test."});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
        });
        test("Include newline and whitespace", () => {
            const instance = new TextTokenizer("\n\r\n  this is\nonly \n \na test.\n\n", {
                includeNewline: true,
                includeWhitespace: true
            })
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "this"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "is"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "only"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "a"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "test."});
            expect(instance.next()).toStrictEqual({kind: "newline"});
            expect(instance.next()).toStrictEqual({kind: "newline"});
        });
        test("Include whitespace only", () => {
            const instance = new TextTokenizer("\n\r\n  this is\nonly \n \na test.\n\n", {includeWhitespace: true})
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "this"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "is"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "only"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "a"});
            expect(instance.next()).toStrictEqual({kind: "whitespace"});
            expect(instance.next()).toStrictEqual({kind: "text", value: "test."});
        });
        test("No tokens", () => {
            const instance = new TextTokenizer("");
            expect(instance.next()).toBeUndefined();
        });
        test("Single token", () => {
            const instance = new TextTokenizer("text!!!");
            expect(instance.next()).toStrictEqual({kind: "text", value: "text!!!"});
            expect(instance.next()).toBeUndefined();
        });
    });
});
