import {freeze} from "immer";
import n271rgJpg from "./assets/images/N271RG_-_Profile_Down.jpg";
import n569dsJpg from "./assets/images/N569DS_-_nose_skyward.jpg";
import n8113bJpg from "./assets/images/N8113B_-_Profile.jpg";

export const CLUB_DATA = freeze({
    aircraft: [
        {
            tailNumber: "N271RG",
            model: "Cessna Skylane",
            modeSCode: "A2ABB1",
            photo: n271rgJpg
        },
        {
            tailNumber: "N569DS",
            model: "Diamond DA40",
            modeSCode: "A748B5",
            photo: n569dsJpg
        },
        {
            tailNumber: "N8113B",
            model: "Piper Archer",
            modeSCode: "AB0FD6",
            photo: n8113bJpg
        }
    ]
}, true);

export type Aircraft = typeof CLUB_DATA["aircraft"][number];
export type TailNumber = Aircraft["tailNumber"];
