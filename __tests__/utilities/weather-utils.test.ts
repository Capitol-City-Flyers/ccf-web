import {DateTime} from "luxon";
import {parseMetar, parseTAF} from "metar-taf-parser";
import {metarFlightCategories, tafFlightCategories} from "../../src/utilities/weather-utils";

describe("weather-utils.ts", () => {
    describe("tafFlightCategories()", () => {
        test("KMSN 2023-06-26", () => {
            const reference = DateTime.fromISO("2023-06-26T00:00:00.000Z", {setZone: true});
            const taf = parseTAF([
                "TAF KMSN 252346Z 2600/2624 28010G18KT P6SM SCT027 BKN060",
                "TEMPO 2600/2604 -RA BKN025",
                "FM260400 30011KT P6SM BKN029",
                "FM260800 31010KT P6SM OVC018",
                "FM261600 32014G22KT P6SM OVC018 PROB30 2616/2619 4SM -SHRA",
                "FM261900 32015G23KT P6SM BKN025"
            ].join("\n"));
            const categories = tafFlightCategories(reference, taf);
            expect(categories.map(({category, interval}) => ({category, interval: interval.toISO()})))
                .toStrictEqual([{
                    category: "mvfr",
                    interval: "2023-06-26T00:00:00.000Z/2023-06-27T00:00:00.000Z"
                }]);
        });
        test("KOTH 2023-06-29", () => {
            const reference = DateTime.fromISO("2023-06-29T00:00:00.000Z", {setZone: true});
            const taf = parseTAF([
                "TAF KOTH 292320Z 3000/3024 35016G22KT P6SM SKC",
                "FM300200 35010KT 3SM BR OVC008",
                "FM300700 35005KT 1SM BR OVC005",
                "FM300900 35005KT 1/2SM FG OVC003"
            ].join("\n"));
            const categories = tafFlightCategories(reference, taf);
            expect(categories.map(({category, interval}) => ({category, interval: interval.toISO()})))
                .toStrictEqual([{
                    category: "vfr",
                    interval: "2023-06-30T00:00:00.000Z/2023-06-30T02:00:00.000Z"
                }, {
                    category: "ifr",
                    interval: "2023-06-30T02:00:00.000Z/2023-06-30T07:00:00.000Z"
                }, {
                    category: "lifr",
                    interval: "2023-06-30T07:00:00.000Z/2023-07-01T00:00:00.000Z"
                }]);
        });
    });
    describe("metarFlightCategories()", () => {
        const reference = DateTime.fromISO("2023-06-25T00:00:00.000Z", {setZone: true});
        test("KMSN 2023-06-25", () => {
            const metars = [
                "KMSN 242353Z 17010KT 10SM BKN220 BKN250 31/12 A2978 RMK AO2 SLP076 T03060117 10333 20306 56007",
                "KMSN 250053Z 18005KT 10SM FEW070 SCT170 BKN210 BKN250 29/12 A2978 RMK AO2 RAB14E19 SLP076 P0000 T02940117",
                "KMSN 250153Z 10004KT 10SM BKN130 BKN180 BKN250 28/12 A2977 RMK AO2 SLP073 T02780122",
                "KMSN 250253Z 00000KT 9SM VCTS -RA SCT075 OVC100 26/16 A2981 RMK AO2 LTG DSNT SW-N RAB29 PRESRR SLP087 P0000 60000 T02560161 53012",
                "KMSN 250313Z 30016G26KT 3SM -RA BKN065 OVC090 21/18 A2986 RMK AO2 PK WND 30026/0312 LTG DSNT SW-NW P0004 T02060178",
                "KMSN 250320Z 31011G26KT 2 1/2SM +RA BR BKN055 OVC070 21/18 A2987 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT S-NW P0009 T02060183",
                "KMSN 250336Z 30008G18KT 2 1/2SM VCTS RA BR FEW055 SCT070 OVC090 20/19 A2988 RMK AO2 PK WND 30026/0312 WSHFT 0306 SFC VIS 4 LTG DSNT S-NW P0016 T02000189",
                "KMSN 250340Z 30008G18KT 1/2SM VCTS RA BR FEW055 SCT070 OVC090 20/19 A2988 RMK AO2 PK WND 30026/0312 WSHFT 0306 SFC VIS 4 LTG DSNT S-NW P0016 T02000189",
                "KMSN 250345Z 01006KT 3SM VCTS RA BR FEW055 BKN075 OVC090 20/19 A2985 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT S-NW P0018 T02000189",
                "KMSN 250349Z 02011KT 3SM TSRA BR FEW055CB BKN075 OVC090 20/18 A2984 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT S-NW TSB48 OCNL LTGIC OHD TS OHD MOV NE P0019",
                "KMSN 250353Z 01007KT 3SM -TSRA BR FEW055CB BKN075 OVC090 20/19 A2984 RMK AO2 PK WND 30026/0312 WSHFT 0306 LTG DSNT SE-SW TSB48 SLP098 OCNL LTGIC OHD TS OHD MOV NE LAST P0020 T02000189",
                "KMSN 250415Z AUTO 10014G30KT 7SM -TSRA FEW050 BKN100 BKN120 20/18 A2975 RMK AO2 PK WND 08030/0407 WSHFT 0355 LTG DSNT ALQDS TSE01B07 P0001 T02000183",
                "KMSN 250428Z AUTO VRB04G20KT 9SM FEW048 SCT100 SCT120 21/18 A2979 RMK AO2 PK WND 08030/0407 WSHFT 0355 LTG DSNT SW RAE20 TSE01B07E22 P0001 T02060178",
                "KMSN 250453Z AUTO 08013KT 8SM FEW120 20/18 A2974 RMK AO2 PK WND 08030/0407 WSHFT 0355 LTG DSNT S AND SW RAE20 TSE01B07E22 SLP064 P0001 T02000178",
                "KMSN 250553Z AUTO 14010KT 10SM CLR 21/17 A2973 RMK AO2 LTG DSNT SE AND S RAB16E31 SLP060 P0000 60021 T02060172 10306 20200 403330161 58027",
                "KMSN 250653Z AUTO 16013KT 10SM CLR 21/17 A2970 RMK AO2 SLP052 T02060172",
                "KMSN 250753Z AUTO 17012KT 10SM SCT065 21/18 A2967 RMK AO2 PRESFR SLP039 T02060178",
                "KMSN 250853Z AUTO 17015G21KT 10SM CLR 20/17 A2966 RMK AO2 SLP037 T02000172 56022",
                "KMSN 250953Z AUTO 16013KT 10SM FEW040 20/17 A2965 RMK AO2 SLP033 T02000172",
                "KMSN 251053Z 17007KT 10SM BKN031 BKN230 20/17 A2963 RMK AO2 SLP027 T02000172",
                "KMSN 251153Z 16009KT 10SM FEW028 FEW230 21/18 A2961 RMK AO2 SLP021 70021 T02060178 10206 20200 58015",
                "KMSN 251202Z 17010KT 10SM FEW014 BKN028 BKN230 21/18 A2961 RMK AO2 T02110178",
                "KMSN 251231Z 16011KT 10SM BKN014 OVC026 21/18 A2960 RMK AO2 T02110178",
                "KMSN 251253Z 17009KT 10SM BKN012 OVC023 21/18 A2960 RMK AO2 SLP017 T02110178",
                "KMSN 251353Z 19010G15KT 10SM OVC013 22/18 A2959 RMK AO2 SLP014 T02170183"
            ].map(metar => parseMetar(metar));
            const categories = metarFlightCategories(reference, metars);
            expect(categories.map(({category, interval}) => ({category, interval: interval.toISO()})))
                .toStrictEqual([{
                    category: "vfr",
                    interval: "2023-06-24T23:53:00.000Z/2023-06-25T03:13:00.000Z"
                }, {
                    category: "mvfr",
                    interval: "2023-06-25T03:13:00.000Z/2023-06-25T03:20:00.000Z"
                }, {
                    category: "ifr",
                    interval: "2023-06-25T03:20:00.000Z/2023-06-25T03:40:00.000Z"
                }, {
                    category: "lifr",
                    interval: "2023-06-25T03:40:00.000Z/2023-06-25T03:45:00.000Z"
                }, {
                    category: "mvfr",
                    interval: "2023-06-25T03:45:00.000Z/2023-06-25T04:15:00.000Z"
                }, {
                    category: "vfr",
                    interval: "2023-06-25T04:15:00.000Z/2023-06-25T12:02:00.000Z"
                }, {
                    category: "mvfr",
                    interval: "2023-06-25T12:02:00.000Z/2023-06-25T13:53:00.000Z"
                }]);
        });
        test("KMSN 2023-06-28", () => {
            const reference = DateTime.fromISO("2023-06-28T00:00:00.000Z", {setZone: true});
            const metars = [
                "KMSN 272353Z 06005KT 2 1/2SM FU OVC036 26/12 A2992 RMK AO2 SLP126 T02610117 10283 20244 58003",
                "KMSN 280051Z 10006KT 1 3/4SM FU OVC033 24/13 A2993 RMK AO2 TWR VIS 2 1/2",
                "KMSN 280053Z 10006KT 1 3/4SM FU OVC033 24/13 A2993 RMK AO2 TWR VIS 2 1/2 SLP131 T02390128",
                "KMSN 280153Z 13006KT 2SM FU OVC031 23/13 A2993 RMK AO2 TWR VIS 2 1/2 SLP133 T02280133",
                "KMSN 280253Z 13004KT 2SM FU OVC033 22/13 A2994 RMK AO2 SLP134 T02170133 53004",
                "KMSN 280336Z 14004KT 1 3/4SM FU OVC031 21/13 A2994 RMK AO2 T02110133",
                "KMSN 280353Z 15006KT 1 3/4SM FU OVC031 21/13 A2994 RMK AO2 SLP134 LAST T02110133",
                "KMSN 280453Z AUTO 20003KT 1 3/4SM HZ OVC030 18/13 A2996 RMK AO2 SLP141 T01780133",
                "KMSN 280525Z AUTO 17003KT 1 1/2SM HZ OVC029 18/13 A2996 RMK AO2 T01830133",
                "KMSN 280553Z AUTO 18004KT 1 1/2SM HZ OVC028 19/14 A2996 RMK AO2 SLP140 T01890139 10261 20172 402830150 53006",
                "KMSN 280653Z AUTO 17006KT 1 1/4SM HZ OVC028 19/14 A2997 RMK AO2 SLP143 T01890139",
                "KMSN 280749Z AUTO 18006KT 1 1/2SM HZ SCT028 18/14 A2997 RMK AO2",
                "KMSN 280753Z AUTO 17006KT 1 1/2SM HZ SCT028 18/14 A2997 RMK AO2 SLP143 T01830139",
                "KMSN 280803Z AUTO 19007KT 1 1/2SM HZ BKN026 18/14 A2997 RMK AO2 T01830139",
                "KMSN 280853Z AUTO 16007KT 1 1/2SM HZ OVC026 18/13 A2998 RMK AO2 SLP145 T01780128 53002",
                "KMSN 280953Z AUTO 18008KT 1 1/2SM HZ OVC026 17/12 A2998 RMK AO2 SLP146 T01720117",
                "KMSN 281053Z 17005KT 1 1/2SM FU BKN019 BKN200 17/11 A2999 RMK AO2 SLP150 T01720111",
                "KMSN 281153Z 20005KT 1 1/2SM FU BKN022 OVC120 18/11 A3003 RMK AO2 SLP164 T01830111 10194 20167 53018"
            ].map(metar => parseMetar(metar));
            const categories = metarFlightCategories(reference, metars);
            expect(categories.map(({category, interval}) => ({category, interval: interval.toISO()})))
                .toStrictEqual([{
                    category: "ifr",
                    interval: "2023-06-27T23:53:00.000Z/2023-06-28T11:53:00.000Z"
                }]);
        });
        test("KMSN 2023-06-26", () => {
            const reference = DateTime.fromISO("2023-06-26T00:00:00.000Z", {setZone: true});
            const metars = [
                "KMSN 251853Z VRB05G24KT 10SM SCT042 BKN080 24/14 A2957 RMK AO2 SLP007 T02390139",
                "KMSN 251953Z 24011G22KT 10SM FEW033 SCT046 BKN080 BKN250 22/14 A2956 RMK AO2 SLP006 T02220144",
                "KMSN 252053Z VRB05KT 10SM FEW023 BKN045 BKN055 BKN130 21/16 A2956 RMK AO2 SLP004 T02060156 58002",
                "KMSN 252153Z VRB05KT 10SM SCT032TCU BKN080 BKN110 BKN130 21/16 A2955 RMK AO2 RAB02E13B42E49 SLP001 TCU OHD P0000 T02110161",
                "KMSN 252253Z 28008G15KT 240V310 10SM SCT027CB BKN120 23/16 A2955 RMK AO2 SLP001 CB SE MOV E TCU DSNT E T02280156",
                "KMSN 252353Z 28008G20KT 250V310 10SM FEW027 SCT110 BKN170 BKN250 22/16 A2956 RMK AO2 SLP003 60000 T02220156 10250 20194 53000",
                "KMSN 260053Z VRB03KT 10SM FEW029 BKN080 BKN100 BKN140 21/17 A2955 RMK AO2 RAB35E44 SLP003 P0000 T02110167",
                "KMSN 260153Z 29006KT 10SM -RA FEW036 BKN100 BKN120 BKN170 BKN250 21/16 A2956 RMK AO2 RAB46 SLP003 P0000 T02110161",
                "KMSN 260253Z VRB04KT 10SM BKN024 BKN045 BKN075 20/17 A2957 RMK AO2 RAE01 SLP008 P0000 60000 T02000167 53004",
                "KMSN 260326Z 29006G17KT 10SM SCT021 SCT026 BKN110 20/17 A2957 RMK AO2 T02000172",
                "KMSN 260353Z 30007KT 10SM BKN017 BKN120 20/17 A2957 RMK AO2 SLP005 LAST T02000172",
                "KMSN 260453Z AUTO 32008G16KT 10SM OVC017 20/17 A2956 RMK AO2 SLP006 T02000172",
                "KMSN 260553Z AUTO 31010G16KT 10SM SCT016 BKN024 BKN045 20/17 A2956 RMK AO2 SLP005 60000 T02000172 10222 20200 402670194 58003",
                "KMSN 260603Z AUTO 31007G15KT 10SM SCT016 SCT024 BKN044 20/17 A2956 RMK AO2 T02000172",
                "KMSN 260653Z AUTO 31006KT 10SM SCT019 BKN034 20/17 A2957 RMK AO2 SLP007 T02000167",
                "KMSN 260707Z AUTO 31008KT 10SM BKN019 BKN038 20/17 A2957 RMK AO2 T02000172",
                "KMSN 260753Z AUTO 32009KT 10SM OVC021 20/17 A2957 RMK AO2 SLP009 T02000167",
                "KMSN 260848Z AUTO 32011G18KT 10SM BKN014 OVC023 19/16 A2959 RMK AO2",
                "KMSN 260853Z AUTO 33010G18KT 10SM BKN014 OVC023 19/16 A2959 RMK AO2 SLP016 T01940161 51008",
                "KMSN 260928Z AUTO 31005KT 10SM OVC015 19/16 A2960 RMK AO2 T01890161",
                "KMSN 260948Z AUTO 32009G15KT 10SM OVC013 19/16 A2960 RMK AO2",
                "KMSN 260953Z AUTO 32008G16KT 10SM OVC013 19/16 A2960 RMK AO2 SLP019 T01890161",
                "KMSN 261053Z 33008G17KT 9SM OVC012 18/16 A2961 RMK AO2 SLP023 T01830156",
                "KMSN 261153Z 32010G16KT 8SM OVC012 18/15 A2962 RMK AO2 SLP027 T01830150 10200 20183 53008"
            ].map(metar => parseMetar(metar));
            const categories = metarFlightCategories(reference, metars);
            expect(categories.map(({category, interval}) => ({category, interval: interval.toISO()})))
                .toStrictEqual([{
                    category: "vfr",
                    interval: "2023-06-25T18:53:00.000Z/2023-06-26T02:53:00.000Z"
                }, {
                    category: "mvfr",
                    interval: "2023-06-26T02:53:00.000Z/2023-06-26T03:26:00.000Z"
                }, {
                    category: "vfr",
                    interval: "2023-06-26T03:26:00.000Z/2023-06-26T03:53:00.000Z"
                }, {
                    category: "mvfr",
                    interval: "2023-06-26T03:53:00.000Z/2023-06-26T06:03:00.000Z"
                }, {
                    category: "vfr",
                    interval: "2023-06-26T06:03:00.000Z/2023-06-26T07:07:00.000Z"
                }, {
                    category: "mvfr",
                    interval: "2023-06-26T07:07:00.000Z/2023-06-26T11:53:00.000Z"
                }]);
        });
    });
});
