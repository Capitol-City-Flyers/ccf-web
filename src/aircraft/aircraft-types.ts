
export interface AircraftIdent {
    tailNumber: TailNumber;
    modeSCodeHex: string;
}

export type TailNumber = Uppercase<string>;
