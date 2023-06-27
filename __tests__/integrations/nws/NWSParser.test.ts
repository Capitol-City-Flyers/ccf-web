import {JSDOM} from "jsdom";
import {NWSParser} from "../../../src/integrations/nws/NWSParser";
import {readUtf8TextResources} from "../../test-data-utils";
import {DateTime} from "luxon";

describe("ResponseParser", () => {
    const instance = NWSParser.create();
    test("parseMetarResponse()", () =>
        readUtf8TextResources("./integrations/nws/aviationweather-metars.html")
            .then(([[, html]]) => {
                expect(instance.parseMetarResponse(JSDOM.fragment(html)))
                    .toStrictEqual({
                        "stations": {
                            "KMSN": {
                                "metars": [
                                    "KMSN 271353Z 35006KT 2 1/2SM FU OVC036 18/13 A2993 RMK AO2 SLP130 T01780128",
                                    "KMSN 271253Z 34008KT 2 1/2SM FU BKN036 16/12 A2991 RMK AO2 SLP127 T01610122",
                                    "KMSN 271234Z 33007KT 2 1/2SM FU BKN031 16/12 A2991 RMK AO2 T01560122",
                                    "KMSN 271153Z 35005KT 2 1/2SM FU BKN029 15/12 A2989 RMK AO2 SLP120 T01500117 10178 20150 53008",
                                    "KMSN 271145Z 34007KT 2 1/2SM FU BKN029 15/12 A2989 RMK AO2 T01500117",
                                    "KMSN 271053Z 34008KT 2 1/2SM FU OVC035 15/12 A2989 RMK AO2 SLP117 T01500117",
                                    "KMSN 271042Z AUTO 35007KT 2SM HZ OVC035 15/12 A2988 RMK AO2 T01500117",
                                    "KMSN 270953Z AUTO 33006KT 3SM HZ OVC030 15/12 A2987 RMK AO2 SLP112 T01500117",
                                    "KMSN 270853Z AUTO 34007KT 3SM HZ OVC027 16/12 A2985 RMK AO2 SLP104 T01560122 52005",
                                    "KMSN 270805Z AUTO 34010KT 3SM HZ BKN027 16/12 A2985 RMK AO2 T01610122"
                                ],
                                "taf": [
                                    "KMSN 271124Z 2712/2812 34009KT 2SM FU OVC050",
                                    "FM271500 36009KT 2SM FU BKN100",
                                    "FM272100 02008KT 5SM FU SCT100",
                                    "FM280000 07005KT 6SM FU SCT100",
                                    "FM280400 14006KT P6SM SCT100"
                                ]
                            },
                            "KC29": {
                                "metars": [
                                    "KC29 271355Z AUTO 35007KT 4SM OVC032 18/13 A2994 RMK AO1 T01840131",
                                    "KC29 271335Z AUTO 31005KT 4SM OVC032 18/13 A2994 RMK AO1 T01770134",
                                    "KC29 271315Z AUTO 32004KT 4SM SCT029 OVC036 17/13 A2993 RMK AO1 T01720133",
                                    "KC29 271255Z AUTO 31003KT 4SM BKN040 OVC045 17/13 A2993 RMK AO1 T01650133",
                                    "KC29 271235Z AUTO 31004KT 4SM SCT029 OVC038 16/13 A2993 RMK AO1 T01600132",
                                    "KC29 271215Z AUTO 29004KT 3SM SCT029 OVC037 16/13 A2993 RMK AO1 T01590133",
                                    "KC29 271155Z AUTO 30004KT 3SM BKN029 OVC037 15/13 A2992 RMK AO1 T01520130 10185 20146",
                                    "KC29 271135Z AUTO 29004KT 3SM OVC033 15/13 A2991 RMK AO1 T01500128",
                                    "KC29 271115Z AUTO 32003KT 3SM OVC033 15/13 A2991 RMK AO1 T01480126",
                                    "KC29 271055Z AUTO 31005KT 3SM OVC033 15/13 A2991 RMK AO1 T01470125",
                                    "KC29 271035Z AUTO 31004KT 3SM OVC033 15/13 A2990 RMK AO1 T01470125",
                                    "KC29 271015Z AUTO 31004KT 5SM OVC029 15/13 A2990 RMK AO1 T01470125",
                                    "KC29 270955Z AUTO 29005KT 5SM OVC029 15/12 A2989 RMK AO1 T01480123",
                                    "KC29 270935Z AUTO 28004KT 5SM OVC027 15/12 A2988 RMK AO1 T01510124",
                                    "KC29 270915Z AUTO 31005KT 5SM OVC027 16/13 A2988 RMK AO1 T01560125",
                                    "KC29 270855Z AUTO 33004KT 5SM OVC027 16/13 A2987 RMK AO1 T01570126",
                                    "KC29 270835Z AUTO 34004KT 5SM BKN027 16/13 A2987 RMK AO1 T01610126",
                                    "KC29 270815Z AUTO 34005KT 5SM CLR 16/13 A2987 RMK AO1 T01630126"
                                ]
                            },
                            "KC35": {
                                "metars": [
                                    "KC35 271355Z AUTO 01005KT 4SM OVC033 18/13 A2994 RMK AO2 T01750125 PWINO",
                                    "KC35 271335Z AUTO 04004KT 4SM SCT026 OVC033 17/13 A2994 RMK AO2 T01690125 PWINO",
                                    "KC35 271315Z AUTO 02003KT 4SM SCT027 OVC033 16/12 A2993 RMK AO2 T01580123 PWINO",
                                    "KC35 271255Z AUTO 00000KT 4SM OVC032 15/12 A2994 RMK AO2 T01490121 PWINO",
                                    "KC35 271235Z AUTO 31003KT 4SM OVC035 14/12 A2994 RMK AO2 T01440119 PWINO",
                                    "KC35 271215Z AUTO 30003KT 4SM OVC037 14/12 A2994 RMK AO2 T01400116 PWINO",
                                    "KC35 271155Z AUTO 29006KT 4SM OVC035 14/12 A2993 RMK AO2 T01390115 10170 20133 PWINO",
                                    "KC35 271135Z AUTO 30004KT 4SM OVC033 14/12 A2992 RMK AO2 T01350116 PWINO",
                                    "KC35 271115Z AUTO 30003KT 4SM OVC031 13/11 A2992 RMK AO2 T01330114 PWINO",
                                    "KC35 271055Z AUTO 33005KT 4SM OVC033 14/11 A2991 RMK AO2 T01380113 PWINO",
                                    "KC35 271035Z AUTO 34005KT 4SM OVC035 14/11 A2991 RMK AO2 T01390113 PWINO",
                                    "KC35 271015Z AUTO 32004KT 5SM OVC037 14/12 A2992 RMK AO2 T01400115 PWINO",
                                    "KC35 270955Z AUTO 32004KT 5SM OVC035 14/11 A2991 RMK AO2 T01420114 PWINO",
                                    "KC35 270935Z AUTO 32006KT 5SM OVC033 15/12 A2990 RMK AO2 T01450115 PWINO",
                                    "KC35 270915Z AUTO 33005KT 5SM OVC029 15/12 A2989 RMK AO2 T01460115 PWINO",
                                    "KC35 270855Z AUTO 33007KT 5SM BKN029 15/12 A2989 RMK AO2 T01490115 PWINO",
                                    "KC35 270835Z AUTO 33007KT 5SM BKN029 15/12 A2988 RMK AO2 T01510116 PWINO",
                                    "KC35 270815Z AUTO 34007KT 5SM CLR 15/12 A2988 RMK AO2 T01530115 PWINO"
                                ]
                            }
                        },
                        "timestamp": DateTime.fromISO("2023-06-27T13:57:00.000Z", {setZone: true})
                    });
            }));
});
