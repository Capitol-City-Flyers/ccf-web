import {MessageResolver, MessageSource, MessageSpec, resolveMessage} from "../../../main/webpack/utils/MessageUtils";
import _, {Dictionary} from "lodash";
import {decorateResolver} from "../../../main/webpack/context/MessagesContext";

describe("MessagesContext", () => {
    describe("decorateResolver()", () => {
        test("Resolves MessageLiteral", () => {
            const source: MessageSource = () => {
                    throw Error("Literal messages should not invoke the message source.");
                },
                resolver: MessageResolver = {
                    resolve: _.partial(resolveMessage, source)
                },
                decorated = decorateResolver(resolver, {
                    "fromMessageLiteral": "&This is a literal message.",
                    "fromMessageLiteralInMessageResolvable": {
                        message: "&This is a literal message from a MessageResolvable."
                    },
                    "fromMessageLiteralInMessageResolvableWithParams": {
                        message: "&This is a literal message from a MessageResolvable: {2} {1} {0}",
                        params: [1, 2, 3]
                    },
                    "fromMessageLiteralInMessageResolvableWithParamsFunction": {
                        message: "&This is a literal message from a MessageResolvable: {2} {1} {0}",
                        params: () => [1, 2, 3]
                    }
                });
            expect(decorated.fromMessageLiteral).toStrictEqual("This is a literal message.");
            expect(decorated.fromMessageLiteralInMessageResolvable)
                .toStrictEqual("This is a literal message from a MessageResolvable.");
            expect(decorated.fromMessageLiteralInMessageResolvableWithParams)
                .toStrictEqual("This is a literal message from a MessageResolvable: 3 2 1");
            expect(decorated.fromMessageLiteralInMessageResolvableWithParamsFunction)
                .toStrictEqual("This is a literal message from a MessageResolvable: 3 2 1");
            expect(decorated.resolve("&This is a message literal with overriding params: {2} {1} {0}", 4, 5, 6))
                .toStrictEqual("This is a message literal with overriding params: 6 5 4");
        });
        test("Resolves MessageKey", () => {
            const messages: Dictionary<string> = {
                    formattedMessage: "This is a message with format tokens: {2} {1} {0}",
                    plainMessage: "This is a plain message."
                },
                source: MessageSource = message => messages[message],
                resolver: MessageResolver = {
                    resolve: _.partial(resolveMessage, source)
                },
                decorated = decorateResolver(resolver, {
                    "fromMessageKey": "plainMessage",
                    "fromMessageKeyInMessageResolvable": {
                        message: "plainMessage"
                    },
                    "fromMessageKeyInMessageResolvableWithParams": {
                        message: "formattedMessage",
                        params: [1, 2, 3]
                    },
                    "fromMessageKeyInMessageResolvableWithParamsFunction": {
                        message: "formattedMessage",
                        params: () => [1, 2, 3]
                    }
                });
            expect(decorated.fromMessageKey).toStrictEqual("This is a plain message.");
            expect(decorated.fromMessageKeyInMessageResolvable).toStrictEqual("This is a plain message.");
            expect(decorated.fromMessageKeyInMessageResolvableWithParams)
                .toStrictEqual("This is a message with format tokens: 3 2 1");
            expect(decorated.fromMessageKeyInMessageResolvableWithParamsFunction)
                .toStrictEqual("This is a message with format tokens: 3 2 1");
            expect(decorated.resolve("formattedMessage", 4, 5, 6))
                .toStrictEqual("This is a message with format tokens: 6 5 4");
        });
    });
});
