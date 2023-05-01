const path = require("path"),
    crypto = require("crypto"),
    {glob} = require("glob"),
    {createReadStream} = require("node:fs"),
    {GenerateSW} = require("workbox-webpack-plugin");

const ONE_MEGABYTE = 1024 * 1024;
const TEN_MEGABYTES = 10 * ONE_MEGABYTE;

module.exports = async (env, argv) => {
    const templateRevision = await md5HexMatches(__dirname, "./src/main/resources/templates/*"),
        development = "development" === argv.mode;
    return {
        devtool: development ? "eval-cheap-source-map" : "source-map",
        entry: "./src/main/webpack/Entry",
        mode: argv.mode,
        output: {
            publicPath: "./static/"
        },
        module: {
            rules: [
                {
                    include: /assets/,
                    type: "asset/resource",
                    generator: {
                        filename: ({filename}) => {
                            const index = filename.lastIndexOf("/assets/");
                            return filename.substring(index + 1);
                        }
                    }
                },
                {
                    test: /\.tsx?$/,
                    use: [{
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-react",
                                "@babel/preset-typescript"
                            ]
                        }
                    }]
                },
                {
                    test: /global\.css$/,
                    include: path.resolve(__dirname, "./src/main/webpack/styles"),
                    use: ["style-loader", "css-loader", "postcss-loader"]
                }
            ]
        },
        plugins: [
            new GenerateSW({
                additionalManifestEntries: [
                    {
                        url: "/",
                        revision: templateRevision
                    }
                ],
                exclude: [/\.LICENSE\.txt$/],
                maximumFileSizeToCacheInBytes: development ? TEN_MEGABYTES : ONE_MEGABYTE,
                modifyURLPrefix: {
                    "./static/": "/static/"
                },
                runtimeCaching: [
                    {
                        urlPattern: "/actuator/health",
                        handler: "NetworkOnly"
                    },
                    {
                        urlPattern: "/user/account/create",
                        handler: "NetworkOnly",
                        method: "POST"
                    },
                    {
                        urlPattern: "/user/prefs",
                        handler: "NetworkOnly"
                    },
                    {
                        urlPattern: "/user/profile",
                        handler: "NetworkOnly",
                        method: "POST"
                    }
                ]
            })
        ],
        resolve: {
            extensions: [".css", ".js", ".ts", ".tsx"]
        },
        target: ["web"]
    };
}

/**
 * Get the MD5 hex digest of (the MD5 digests of) contents of all files matching an array of glob patterns under a
 * source directory.
 *
 * @param {string} dir the base directory.
 * @param {...string} patterns the glob patterns.
 * @return {Promise<string>}
 */
const md5HexMatches = (dir, ...patterns) => {
    const prefix = dir.replace(/\\/g, "/").replace(/\/+$/, "");
    return Promise.all(patterns.map(pattern => glob(`${prefix}/${pattern}`)))
        .then(matchArrays => {

            /* Get the MD5 digest of each matching file. */
            const matches = Array.prototype.concat.apply([], matchArrays);
            return Promise.all(matches.sort().map(match => {
                return new Promise((resolve, reject) => {
                    try {
                        const hash = crypto.createHash("md5"),
                            input = createReadStream(match);
                        input.on("readable", () => {
                            const data = input.read();
                            if (data) {
                                hash.update(data);
                            } else {
                                resolve(hash.digest());
                            }
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }));
        })
        .then(digests => {

            /* Get the MD5 hex digest of the MD5 digests of each matching file. */
            const hash = crypto.createHash("md5");
            digests.forEach(digest => hash.update(digest));
            return hash.digest("hex");
        });
};
