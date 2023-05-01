import path from "path";
import {glob} from "glob";
import {decryptTextResource} from "./TestDataUtils";

describe("TestDataUtils", () => {
    describe("decryptTextResource()", () => {
        test("Can decrypt all encrypted test resources", async () => {
            const base = path.resolve(__dirname, "../../resources/"),
                prefix = base.replace(/\\/g, "/"),
                paths = await glob(`${prefix}/**/*.enc`);
            return Promise.all(paths.map(next => decryptTextResource(path.relative(base, next))));
        });
    });
});
