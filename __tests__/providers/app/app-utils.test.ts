import {createRoleResolver, evaluateRoles, missingRoles} from "../../../src/providers/app/app-utils";

describe("app-utils.ts", () => {
    describe("createRoleResolver()", () => {
        describe("When a spec is provided", () => {
            const resolver = createRoleResolver(["authenticated", "identified"], {
                anySpecMet: {any: ["authenticated", "fullyAuthenticated"]},
                anySpecUnmet: {any: ["fullyAuthenticated", "unidentified"]},
                allSpecMet: {all: ["authenticated", "identified"]},
                allSpecUnmet: {all: ["authenticated", "fullyAuthenticated"]}
            });
            test("evaluateRoles()", () => {
                expect(resolver.evaluateRoles("authenticated")).toBe(true);
                expect(resolver.evaluateRoles("fullyAuthenticated")).toBe(false);
            });
            test("missingRoles()", () => {
                expect(resolver.missingRoles("authenticated")).toStrictEqual([]);
                expect(resolver.missingRoles("fullyAuthenticated")).toStrictEqual(["fullyAuthenticated"]);
            });
            test("Attributes", () => {
                expect(Object.keys(resolver).length).toBe(6);
                expect(resolver.authenticated).toBe(true);
                expect(resolver.identified).toBe(true);
                expect(resolver.anySpecMet).toBe(true);
                expect(resolver.allSpecMet).toBe(true);
            });
        });
        describe("When no spec is provided", () => {
            const resolver = createRoleResolver(["unidentified"]);
            test("evaluateRoles()", () => {
                expect(resolver.evaluateRoles("unidentified")).toBe(true);
                expect(resolver.evaluateRoles("authenticated")).toBe(false);
            });
            test("missingRoles()", () => {
                expect(resolver.missingRoles("unidentified")).toStrictEqual([]);
                expect(resolver.missingRoles("authenticated")).toStrictEqual(["authenticated"]);
            });
            test("Attributes", () => {
                expect(Object.keys(resolver).length).toBe(3);
                expect(resolver.unidentified).toBe(true);
            });
        });
    });
    describe("evaluateRoles()", () => {
        test("When a single role is required and it is granted", () => {
            expect(evaluateRoles(["unidentified"], "unidentified")).toBe(true);
            expect(evaluateRoles(["unidentified"], ["unidentified"])).toBe(true);
            expect(evaluateRoles(["unidentified"], {all: "unidentified"})).toBe(true);
            expect(evaluateRoles(["unidentified"], {any: "unidentified"})).toBe(true);
            expect(evaluateRoles(["unidentified"], {all: ["unidentified"]})).toBe(true);
            expect(evaluateRoles(["unidentified"], {any: ["unidentified"]})).toBe(true);
        });
        test("When a single role is required and it is not granted", () => {
            expect(evaluateRoles(["unidentified"], "authenticated")).toBe(false);
            expect(evaluateRoles(["unidentified"], ["authenticated"])).toBe(false);
            expect(evaluateRoles(["unidentified"], {all: "authenticated"})).toBe(false);
            expect(evaluateRoles(["unidentified"], {any: "authenticated"})).toBe(false);
            expect(evaluateRoles(["unidentified"], {all: ["authenticated"]})).toBe(false);
            expect(evaluateRoles(["unidentified"], {any: ["authenticated"]})).toBe(false);
        });
        test("When multiple roles are required all are granted", () => {
            expect(evaluateRoles(["authenticated", "identified"], ["authenticated", "identified"]))
                .toBe(true);
            expect(evaluateRoles(["authenticated", "identified"], {all: ["authenticated", "identified"]}))
                .toBe(true);
        });
        test("When multiple roles are required and none are granted", () => {
            expect(evaluateRoles([], ["authenticated", "identified"]))
                .toBe(false);
            expect(evaluateRoles([], {all: ["authenticated", "identified"]}))
                .toBe(false);
            expect(evaluateRoles([], {any: ["authenticated", "identified"]}))
                .toBe(false);
        });
        test("When multiple roles are required and some are granted", () => {
            expect(evaluateRoles(["identified"], ["authenticated", "identified"]))
                .toBe(false);
            expect(evaluateRoles(["identified"], {all: ["authenticated", "identified"]}))
                .toBe(false);
            expect(evaluateRoles(["identified"], {any: ["authenticated", "identified"]}))
                .toBe(true);
        });
    });
    describe("missingRoles()", () => {
        test("When a single role is required and it is granted.", () => {
            expect(missingRoles(["unidentified"], "unidentified")).toStrictEqual([]);
            expect(missingRoles(["unidentified"], ["unidentified"])).toStrictEqual([]);
        });
        test("When multiple roles are required and all are granted.", () => {
            expect(missingRoles(["authenticated", "identified"], "authenticated", "identified"))
                .toStrictEqual([]);
            expect(missingRoles(["authenticated", "identified"], ["authenticated", "identified"]))
                .toStrictEqual([]);
            expect(missingRoles(["authenticated", "identified"], ["authenticated"], ["identified"]))
                .toStrictEqual([]);
        });
        test("When multiple roles are required and none are granted.", () => {
            expect(missingRoles([], "authenticated", "identified"))
                .toStrictEqual(["authenticated", "identified"]);
            expect(missingRoles([], ["authenticated", "identified"]))
                .toStrictEqual(["authenticated", "identified"]);
            expect(missingRoles([], ["authenticated"], ["identified"]))
                .toStrictEqual(["authenticated", "identified"]);
        });
        test("When multiple roles are required and some are not granted.", () => {
            expect(missingRoles(["identified"], "authenticated", "identified"))
                .toStrictEqual(["authenticated"]);
            expect(missingRoles(["identified"], ["authenticated", "identified"]))
                .toStrictEqual(["authenticated"]);
            expect(missingRoles(["identified"], ["authenticated"], ["identified"]))
                .toStrictEqual(["authenticated"]);
        });
        test("When no roles are required.", () => {
            expect(missingRoles(["unidentified"])).toStrictEqual([]);
        });
    });
});