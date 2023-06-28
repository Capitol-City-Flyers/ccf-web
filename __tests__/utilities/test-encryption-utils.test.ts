import {decrypt, decryptUTF8Hex, encrypt, encryptUTF8Hex} from "../test-encryption-utils";
import * as crypto from "crypto";

describe("test-encryption-utils.ts", () => {
    test("decrypt()", () => {
        const input = Buffer.from("c373471f6d69b426177ae72cb17cd35db294cc97e685c36713409db937c5f3aca939517548f5ed4200f239e6d8e83139", "hex");
        const decrypted = decrypt("😊passphrase😊", input);
        expect(decrypted.toString("utf8")).toBe("😊this is only a test😊")
    });
    test("encrypt()", () => {
        const input = crypto.randomBytes(1024);
        const encrypted = encrypt("😊passphrase😊", input);
        const decrypted = decrypt("😊passphrase😊", encrypted);
        expect(input.compare(decrypted)).toBe(0);
    });
    describe("decryptUTF8Hex()", () => {
        test("Known encrypted string", () => {
            expect(decryptUTF8Hex("😊passphrase😊", "c373471f6d69b426177ae72cb17cd35db294cc97e685c36713409db937c5f3aca939517548f5ed4200f239e6d8e83139"))
                .toBe("😊this is only a test😊");
        });
        test("Ignores whitespace anywhere in the hex input", () => {
            expect(decryptUTF8Hex("😊passphrase😊", " c373471f6d69b426177ae72cb17cd35db294cc97e6 " +
                " 85c36713409db937c5f3aca939517548f5ed4200f239e6d8e83139 ")).toBe("😊this is only a test😊");
        });
    });
    test("encryptUTF8Hex()", () => {
        const input = "😊this is only a test😊";
        const encrypted = encryptUTF8Hex("😊passphrase😊", input);
        expect(Buffer.from(encrypted, "hex").length).toBeGreaterThan(0);
        expect(decryptUTF8Hex("😊passphrase😊", encrypted)).toBe(input)
    });
});
