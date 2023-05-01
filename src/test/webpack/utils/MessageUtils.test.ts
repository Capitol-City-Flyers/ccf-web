import {localeLookupList, MessageSource, resolveBundle, resolveMessage} from "../../../main/webpack/utils/MessageUtils";
import _, {Dictionary} from "lodash";

describe("MessageUtils", () => {
    describe("localeLookupList()", () => {
        test("Parses locales into appropriate lookup lists", () => {
            expect(localeLookupList("")).toStrictEqual([""]);
            expect(localeLookupList("en")).toStrictEqual(["en", ""]);
            expect(localeLookupList("en-US")).toStrictEqual(["en-US", "en", ""]);
        });
    });
    describe("resolveBundle()", () => {
        const messagesByLocale: Dictionary<Dictionary<string>> = {
            "": {
                in_all: "value in all from default",
                in_default_only: "value in default only from default",
                in_language_and_default: "value in language and default from default"
            },
            "en": {
                in_all: "value in all from [en]",
                in_language_and_default: "value in language and default from [en]"
            },
            "en-US": {
                in_all: "value in all from [en-US]"
            }
        }
        test("Includes messages from most specific locale.", () => {
            expect(resolveBundle(messagesByLocale, [""]))
                .toStrictEqual({
                    in_all: "value in all from default",
                    in_default_only: "value in default only from default",
                    in_language_and_default: "value in language and default from default"
                });
            expect(resolveBundle(messagesByLocale, ["en", ""]))
                .toStrictEqual({
                    in_all: "value in all from [en]",
                    in_default_only: "value in default only from default",
                    in_language_and_default: "value in language and default from [en]"
                });
            expect(resolveBundle(messagesByLocale, ["en-US", "en", ""]))
                .toStrictEqual({
                    in_all: "value in all from [en-US]",
                    in_default_only: "value in default only from default",
                    in_language_and_default: "value in language and default from [en]"
                });
        });
    });
    describe("resolveMessage()", () => {
        const messages: Dictionary<string> = {
                formattedMessage: "This is a message with format tokens: {2} {1} {0}",
                plainMessage: "This is a plain message."
            },
            source: MessageSource = message => messages[message];
        test("Resolves a MessageLiteral", () => {
            expect(resolveMessage(source, "&This is a literal message."))
                .toStrictEqual("This is a literal message.");
        });
        test("Resolves a MessageLiteral in a MessageResolvable", () => {
            expect(resolveMessage(source, {message: "&This is a literal message"}))
                .toStrictEqual("This is a literal message");
        });
        test("Resolves a MessageLiteral in a MessageResolvable with params", () => {
            expect(resolveMessage(source, {message: "&This is a literal message: {2} {1} {0}", params: [1, 2, 3]}))
                .toStrictEqual("This is a literal message: 3 2 1");
        });
        test("Resolves a MessageLiteral in a MessageResolvable with params function", () => {
            expect(resolveMessage(source, {
                message: "&This is a literal message: {2} {1} {0}",
                params: () => [1, 2, 3]
            })).toStrictEqual("This is a literal message: 3 2 1");
        });
        test("Resolves a MessageLiteral with overriding params", () => {
            expect(resolveMessage(source, "&This is a literal message: {2} {1} {0}", 1, 2, 3))
                .toStrictEqual("This is a literal message: 3 2 1");
        });
        test("Resolves a MessageKey", () => {
            expect(resolveMessage(source, "plainMessage"))
                .toStrictEqual("This is a plain message.");
        });
        test("Resolves a MessageKey in a MessageResolvable", () => {
            expect(resolveMessage(source, {message: "plainMessage"}))
                .toStrictEqual("This is a plain message.");
        });
        test("Resolves a MessageKey in a MessageResolvable with params", () => {
            expect(resolveMessage(source, {message: "formattedMessage", params: [1, 2, 3]}))
                .toStrictEqual("This is a message with format tokens: 3 2 1");
        });
        test("Resolves a MessageKey in a MessageResolvable with params function", () => {
            expect(resolveMessage(source, {message: "formattedMessage", params: () => [1, 2, 3]}))
                .toStrictEqual("This is a message with format tokens: 3 2 1");
        });
        test("Resolves a MessageKey with overriding params", () => {
            expect(resolveMessage(source, "formattedMessage", 4, 5, 6))
                .toStrictEqual("This is a message with format tokens: 6 5 4");
        });
    });
});
