import {OpenSkyClient} from "../../../src/integrations/opensky/OpenSkyClient";
import {encryptText} from "../../test-data-utils";

describe("OpenSkyClient", () => {
    // test("queryPositions()", async () => {
    //     if (!canDecryptTextResources()) {
    //         return Promise.resolve();
    //     } else {
    //         const credentials = decryptText(OPENSKY_CREDENTIALS_ENC),
    //             [username, password] = credentials.split(":"),
    //             instance = OpenSkyClient.create(Axios.create({
    //                 auth: {username, password},
    //                 baseURL: "https://opensky-network.org/api/",
    //                 paramsSerializer: params => qs.stringify(params, {arrayFormat: "repeat"}),
    //                 validateStatus: validateIn(200, 429)
    //             }));
    //         const aircraft: Array<AircraftConfig> = [{
    //             tailNumber: "N12345",
    //             modeSCodeHex: "A6692D",
    //             refs: {}
    //         }, {
    //             tailNumber: "N23456",
    //             modeSCodeHex: "A7ED0D",
    //             refs: {}
    //         }, {
    //             tailNumber: "N34567",
    //             modeSCodeHex: "A05B83",
    //             refs: {}
    //         }];
    //         const positions = await instance.queryPositions(aircraft);
    //         console.dir(positions);
    //     }
    // });
});

/**
 * OpenSky API credentials encrypted via {@link encryptText}.
 */
const OPENSKY_CREDENTIALS_ENC = "15ba7eeb289079ba82fe79e69c5ec543:ef6c5850edb2dd02119549f4f071ab00f55066186a7e04ff16e662a21b1a2521";
