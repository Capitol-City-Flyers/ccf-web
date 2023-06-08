
export interface Aircraft {
    tailNumber: TailNumber;
    manufacturer: string;
    model: string;
    modeSCodeHex: string;
}

export type TailNumber = Uppercase<string>;
