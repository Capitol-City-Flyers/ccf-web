import {WeightedItemGraph} from "../../src/utilities/WeightedItemGraph";

describe("WeightedItemGraph", () => {
    describe("span()", () => {
        const graph = WeightedItemGraph.create<number, string>({
            vertices: [1, 2],
            item: "b"
        }, {
            vertices: [2, 3],
            item: "c"
        }, {
            vertices: [3, 5],
            item: "d"
        }, {
            vertices: [3, 4],
            item: "e"
        }, {
            vertices: [4, 5],
            item: "f"
        }, {
            vertices: [5, 6],
            item: "g"
        }, {
            vertices: [7, 8],
            item: "h"
        }, {
            vertices: [8, 9],
            item: "i"
        });
        test("For a multi edge span", () => {
            expect(graph.span(1, 4)).toStrictEqual(["b", "c", "e"]);
        });
        test("For a single edge span", () => {
            expect(graph.span(2, 3)).toStrictEqual(["c"]);
        });
        test("For a span with multiple candidates (should be least cost)", () => {
            expect(graph.span(2, 6)).toStrictEqual(["c", "d", "g"]);
        });
        test("For a span with no path", () => {
            expect(() => {
                graph.span(5, 9);
            }).toThrow(Error);
        });
    });
});
