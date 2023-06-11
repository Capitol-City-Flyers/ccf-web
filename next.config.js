const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: false
});

/**
 * @type {(phase: string) => import("next").NextConfig}
 */
module.exports = phase => {
    let config;
    if ("phase-development-server" !== phase) {
        config = {
            output: "export"
        }
    } else {
        config = {
            rewrites: async () => [{
                source: "/api/aircraftclubs/:path*",
                destination: "https://www.aircraftclubs.com/:path*"
            }, {
                source: "/api/faa/nfdc/:path*",
                destination: "https://nfdc.faa.gov/:path*"
            }]
        };
    }
    return withPWA(config);
};
