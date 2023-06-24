import {metarFlightCategories, tafFlightCategories} from "../../src/utilities/weather-utils";
import {parseMetar, parseTAF} from "metar-taf-parser";
import {DateTime, Interval} from "luxon";

describe("weather-utils.ts", () => {
    describe("metarFlightCategories()", () => {
        test("Known sequence", () => {
            const metars = [
                "KMSN 251353Z 19010G15KT 10SM OVC013 22/18 A2959 RMK AO2 SLP014 T02170183",
                "KMSN 251253Z 17009KT 10SM BKN012 OVC023 21/18 A2960 RMK AO2 SLP017 T02110178",
                "KMSN 251231Z 16011KT 10SM BKN014 OVC026 21/18 A2960 RMK AO2 T02110178",
                "KMSN 251202Z 17010KT 10SM FEW014 BKN028 BKN230 21/18 A2961 RMK AO2 T02110178",
                "KMSN 251153Z 16009KT 10SM FEW028 FEW230 21/18 A2961 RMK AO2 SLP021 70021 T02060178 10206 20200 58015",
                "KMSN 251053Z 17007KT 10SM BKN031 BKN230 20/17 A2963 RMK AO2 SLP027 T02000172",
                "KMSN 250953Z AUTO 16013KT 10SM FEW040 20/17 A2965 RMK AO2 SLP033 T02000172",
                "KMSN 250853Z AUTO 17015G21KT 10SM CLR 20/17 A2966 RMK AO2 SLP037 T02000172 56022",
                "KMSN 250753Z AUTO 17012KT 10SM SCT065 21/18 A2967 RMK AO2 PRESFR SLP039 T02060178",
                "KMSN 250653Z AUTO 16013KT 10SM CLR 21/17 A2970 RMK AO2 SLP052 T02060172",
                "KMSN 250553Z AUTO 14010KT 10SM CLR 21/17 A2973 RMK AO2 LTG DSNT SE AND S RAB16E31 SLP060 P0000 60021 T02060172 10306 20200 403330161 58027",
                "KMSN 250453Z AUTO 08013KT 8SM FEW120 20/18 A2974 RMK AO2 PK WND 08030/0407 WSHFT 0355 LTG DSNT S AND SW RAE20 TSE01B07E22 SLP064 P0001 T02000178",
                "KMSN 250428Z AUTO VRB04G20KT 9SM FEW048 SCT100 SCT120 21/18 A2979 RMK AO2 PK WND 08030/0407 WSHFT 0355 LTG DSNT SW RAE20 TSE01B07E22 P0001 T02060178",
                "KMSN 250415Z AUTO 10014G30KT 7SM -TSRA FEW050 BKN100 BKN120 20/18 A2975 RMK AO2 PK WND 08030/0407 WSHFT 0355 LTG DSNT ALQDS TSE01B07 P0001 T02000183",
                "KMSN 250353Z 01007KT 3SM -TSRA BR FEW055CB BKN075 OVC090 20/19 A2984 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT SE-SW TSB48 SLP098 OCNL LTGIC OHD TS OHD MOV NE LAST P0020 T02000189",
                "KMSN 250349Z 02011KT 3SM TSRA BR FEW055CB BKN075 OVC090 20/18 A2984 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT S-NW TSB48 OCNL LTGIC OHD TS OHD MOV NE P0019",
                "KMSN 250345Z 01006KT 3SM VCTS RA BR FEW055 BKN075 OVC090 20/19 A2985 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT S-NW P0018 T02000189",
                "KMSN 250336Z 30008G18KT 1/2SM VCTS RA BR FEW055 SCT070 OVC090 20/19 A2988 RMK AO2 PK WND 30026/0312 WSHFT 0306 SFC VIS 4 LTG DSNT S-NW P0016 T02000189",
                "KMSN 250336Z 30008G18KT 2 1/2SM VCTS RA BR FEW055 SCT070 OVC090 20/19 A2988 RMK AO2 PK WND 30026/0312 WSHFT 0306 SFC VIS 4 LTG DSNT S-NW P0016 T02000189",
                "KMSN 250320Z 31011G26KT 2 1/2SM +RA BR BKN055 OVC070 21/18 A2987 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT S-NW P0009 T02060183",
                "KMSN 250313Z 30016G26KT 3SM -RA BKN065 OVC090 21/18 A2986 RMK AO2 PK WND 30026/0312 LTG DSNT SW-NW P0004 T02060178",
                "KMSN 250253Z 00000KT 9SM VCTS -RA SCT075 OVC100 26/16 A2981 RMK AO2 LTG DSNT SW-N RAB29 PRESRR SLP087 P0000 60000 T02560161 53012",
                "KMSN 250153Z 10004KT 10SM BKN130 BKN180 BKN250 28/12 A2977 RMK AO2 SLP073 T02780122",
                "KMSN 250053Z 18005KT 10SM FEW070 SCT170 BKN210 BKN250 29/12 A2978 RMK AO2 RAB14E19 SLP076 P0000 T02940117",
                "KMSN 242353Z 17010KT 10SM BKN220 BKN250 31/12 A2978 RMK AO2 SLP076 T03060117 10333 20306 56007"
            ];
            const reference = DateTime.fromISO("2023-06-24T12:34:56.789Z", {setZone: true});
            const intervals = metarFlightCategories(reference, metars.map(metar => parseMetar(metar)));
            expect(intervals).toStrictEqual([{
                category: "VFR",
                interval: Interval.fromISO("2023-06-24T23:53:00.000Z/2023-06-25T02:53:00.000Z", {setZone: true})
            }, {
                category: "MVFR",
                interval: Interval.fromISO("2023-06-25T03:13:00.000Z/2023-06-25T03:13:00.000Z", {setZone: true})
            }, {
                category: "IFR",
                interval: Interval.fromISO("2023-06-25T03:20:00.000Z/2023-06-25T03:20:00.000Z", {setZone: true})
            }, {
                category: "LIFR",
                interval: Interval.fromISO("2023-06-25T03:36:00.000Z/2023-06-25T03:36:00.000Z", {setZone: true})
            }, {
                category: "IFR",
                interval: Interval.fromISO("2023-06-25T03:36:00.000Z/2023-06-25T03:36:00.000Z", {setZone: true})
            }, {
                category: "MVFR",
                interval: Interval.fromISO("2023-06-25T03:45:00.000Z/2023-06-25T03:53:00.000Z", {setZone: true})
            }, {
                category: "VFR",
                interval: Interval.fromISO("2023-06-25T04:15:00.000Z/2023-06-25T11:53:00.000Z", {setZone: true})
            }, {
                category: "MVFR",
                interval: Interval.fromISO("2023-06-25T12:02:00.000Z/2023-06-25T13:53:00.000Z", {setZone: true})
            }]);
        });
    });
    test("tafFlightCategories()", () => {
        const taf = parseTAF([
            "KMSN 251359Z 2514/2612 19010G15KT P6SM BKN015",
            "FM251600 24011KT P6SM BKN035",
            "FM252100 26012KT P6SM BKN040",
            "FM260300 29010G21KT P6SM BKN009",
            "PROB30 2603/2604 4SM -SHRA BR"
        ].join("\n"));
        const reference = DateTime.fromISO("2023-06-24T12:34:56.789Z", {setZone: true});
        const intervals = tafFlightCategories(reference, taf);
        expect(intervals).toStrictEqual([
            {
                category: "MVFR",
                interval: Interval.fromISO("2023-06-25T14:00:00.000Z/2023-06-25T16:00:00.000Z", {setZone: true})
            },
            {
                category: "VFR",
                interval: Interval.fromISO("2023-06-25T16:00:00.000Z/2023-06-26T03:00:00.000Z", {setZone: true})
            },
            {
                category: "IFR",
                interval: Interval.fromISO("2023-06-26T03:00:00.000Z/2023-06-26T03:00:00.000Z", {setZone: true})
            },
            {
                category: "MVFR",
                interval: Interval.fromISO("2023-06-26T03:00:00.000Z/2023-06-26T04:00:00.000Z", {setZone: true})
            },
            {
                category: "IFR",
                interval: Interval.fromISO("2023-06-26T04:00:00.000Z/2023-06-26T12:00:00.000Z", {setZone: true})
            }
        ]);
    });
});
