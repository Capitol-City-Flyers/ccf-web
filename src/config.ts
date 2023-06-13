import {Config, Environment} from "./config-types";
import AircraftClubsProvider from "./integrations/aircraftclubs/AircraftClubsProvider";
import OpenSkyProvider from "./integrations/opensky/OpenSkyProvider";
import NominatimProvider from "./integrations/nominatim/NominatimProvider";

export default function (env: Environment) {
    const build = "_build" === env;
    return {
        auth: {
            defaultRoles: ["unidentified"]
        },
        defaults: {
            prefs: {
                device: {
                    enableGeolocation: false,
                    install: false
                },
                auth: {
                    retention: "none"
                },
                ui: {
                    language: "en"
                }
            }
        },
        integration: {
            aircraftClubs: {
                baseURL: build
                    ? new URL("https://www.aircraftclubs.com/")
                    : new URL("/api/aircraftclubs/", env),
                roleMappings: {
                    1: "superAdmin",
                    2: "siteAdmin",
                    14: "maintenanceAdmin",
                    15: "scheduleAdmin",
                    16: "memberAdmin",
                    20: "reportViewer",

                    /* Note: 98/99 don't seem to come back correctly in the login response, they may be reversed. The
                    values on the edit roles page are 98=member and 99=guest, but my account has "member" role, NOT
                    "guest" role, while login returns 99 but NOT 98 for me. */
                    98: "guest",
                    99: "member"
                }
            },
            faa: {
                nfdc: {
                    baseURL: build
                        ? new URL("https://nfdc.faa.gov/")
                        : new URL("/api/faa/nfdc/", env),
                    include: [
                        "airports",
                        "weatherStations"
                    ]
                }
            },
            nominatim: {
                baseURL: new URL("https://nominatim.openstreetmap.org/")
            },
            openSky: {
                baseURL: new URL("https://opensky-network.org/api/")
            }
        },
        operator: {
            aircraft: [
                {
                    tailNumber: "N271RG",
                    modeSCodeHex: "A2ABB1",
                    refs: {aircraftClubs: "679"}
                },
                {
                    tailNumber: "N569DS",
                    modeSCodeHex: "A748B5",
                    refs: {aircraftClubs: "680"}
                },
                {
                    tailNumber: "N8113B",
                    modeSCodeHex: "AB0FD6",
                    refs: {aircraftClubs: "681"}
                }
            ]
        },
        providers: [
            AircraftClubsProvider,
            NominatimProvider,
            OpenSkyProvider
        ],
        sync: {
            flights: {
                inFlightInterval: {minute: 5},
                notInFlightInterval: {minute: 15}
            }
        }
    } satisfies Config;
};
