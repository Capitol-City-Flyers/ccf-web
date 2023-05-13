import {createHash} from "crypto";
import {glob} from "glob";
import path from "path";
import _ from "lodash";
import {decryptTextResource, readUtf8TextResources} from "./TestDataUtils";

describe("TestDataUtils", () => {
    describe("decryptTextResource()", () => {
        test("Can decrypt all encrypted test resources", async () => {
            const base = path.resolve(__dirname, "../../resources/"),
                prefix = base.replace(/\\/g, "/"),
                paths = await glob(`${prefix}/**/*.enc`);
            return Promise.all(paths.map(next => decryptTextResource(path.relative(base, next))));
        });
    });
    describe("readUtf8TextResources()", () => {
        test("Reads the full contents of test data files", async () =>
            readUtf8TextResources("./cycles/noaa/taf/taf-20230424-*.txt.br")
                .then(matches => {
                    const hashes = matches.map(([path, content]) =>
                        [path.base, createHash("sha256").update(content).digest("hex")] as const
                    );
                    expect(_.sortBy(hashes)).toStrictEqual([
                        ["taf-20230424-00Z.txt.br", "643ad7b3b234e2b6e8e5e9d86953bb4bed424bf1afa02dbbf6df924119a64cf5"],
                        ["taf-20230424-06Z.txt.br", "b3c85c8a796818ae2e75458f4f446ac9a423443d583c3989c14a5492cb21e114"],
                        ["taf-20230424-12Z.txt.br", "f3984573cea24cb021af97b7097987f2b751a9457ba289d3418a0c3df2c42341"],
                        ["taf-20230424-18Z.txt.br", "4d033d4538a59e1a6e552136e1cffb70114d8ad61d42879a881a7c3ccd05384f"]
                    ]);
                }));
    });
});
