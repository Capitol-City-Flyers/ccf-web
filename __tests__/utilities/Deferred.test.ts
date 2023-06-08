import {Deferred} from "../../src/utilities/Deferred";

describe("Deferred", () => {
    test("catch()", async () => {
        const deferred = Deferred.create<string>();
        let caught = false;
        deferred.catch(ex => {
            expect(ex).toBe("testing");
            caught = true;
        });
        deferred.reject("testing");
        try {
            await deferred;
            expect(true).toBe(false);
        } catch (ex) {
            expect(ex).toBe("testing");
        }
        expect(caught).toBe(true);
    });
    describe("finally()", () => {
        test("when rejected", async () => {
            const deferred = Deferred.create<string>();
            let completed = false,
                caught = false;
            deferred.reject("testing");
            deferred.catch(ex => {
                expect(ex).toBe("testing");
                caught = true;
            }).finally(() => {
                completed = true;
            });
            try {
                await deferred;
                expect(true).toBe(false);
            } catch (ex) {
                expect(ex).toBe("testing");
            }
            expect(caught).toBe(true);
            expect(completed).toBe(true);
        });
        test("when resolved", async () => {
            const deferred = Deferred.create<string>();
            let completed = false;
            deferred.resolve("testing");
            deferred.finally(() => {
                completed = true;
            });
            expect(await deferred).toBe("testing");
            expect(completed).toBe(true);
        });
    });
    test("resolve()", async () => {
        const deferred = Deferred.create<string>();
        deferred.resolve("testing");
        expect(await deferred).toBe("testing");
    });
    test("reject()", async () => {
        const deferred = Deferred.create<string>();
        deferred.reject("testing");
        try {
            await deferred;
            expect(true).toBe(false);
        } catch (ex) {
            expect(ex).toBe("testing");
        }
    });
    test("then()", async () => {
        const deferred = Deferred.create<string>();
        deferred.resolve("testing");
        expect(await deferred.then(value => value + "!!!")).toBe("testing!!!");
    });
});
