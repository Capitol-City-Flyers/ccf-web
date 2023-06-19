const {DateTime} = require("luxon");
const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: false
});

/**
 * @type {(phase: string) => import("next").NextConfig}
 */
module.exports = phase => {
    let config = {
        publicRuntimeConfig: Object.assign({
            buildTimestamp: DateTime.now().setZone("UTC").toISO(),
            version: `@@:VERSION=${process.env["npm_package_version"] || ""}:@@`
        })
    };
    if ("phase-development-server" !== phase) {
        Object.assign(config, {
            output: "export"
        });
    } else {
        Object.assign(config, {
            rewrites: async () => [{
                source: "/api/aircraftclubs/:path*",
                destination: "https://www.aircraftclubs.com/:path*"
            }, {
                source: "/api/faa/nfdc/:path*",
                destination: "https://nfdc.faa.gov/:path*"
            }]
        });
    }
    return withPWA(config);
};
