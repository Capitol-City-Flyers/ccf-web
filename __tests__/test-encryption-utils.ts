import * as crypto from "crypto";

/**
 * PBE-decrypt data which was previously encrypted via {@link encrypt}.
 *
 * @param passphrase the encryption passphrase.
 * @param encrypted the encrypted data.
 */
export function decrypt(passphrase: string, encrypted: Buffer) {
    const key = crypto.pbkdf2Sync(passphrase, encryptionSalt, 65_536, 32, "sha256")
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, encrypted.subarray(0, 16));
    const decrypted = decipher.update(encrypted.subarray(16));
    const final = decipher.final();
    const output = Buffer.alloc(decrypted.length + final.length);
    decrypted.copy(output);
    final.copy(output, decrypted.length);
    return output;
}

/**
 * PBE-decrypt a string which was previously encrypted via {@link encryptUTF8Hex}.
 *
 * @param passphrase the encryption passphrase.
 * @param inputHex the encrypted string.
 */
export function decryptUTF8Hex(passphrase: string, inputHex: string) {
    const input = Buffer.from(inputHex.replace(/\s+/g, ""), "hex");
    return decrypt(passphrase, input).toString("utf8");
}

/**
 * PBE-encrypt data with a given passphrase. Returns a buffer consisting of a 16-byte randomly generated cipher
 * initialization vector followed by the encrypted data. Use {@link decrypt} to decrypt this buffer.
 *
 * @param passphrase the encryption passphrase.
 * @param input the input data.
 */
export function encrypt(passphrase: string, input: Buffer) {
    const iv = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(passphrase, encryptionSalt, 65_536, 32, "sha256");
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = cipher.update(input);
    const final = cipher.final();
    const output = Buffer.alloc(16 + encrypted.length + final.length);
    iv.copy(output);
    encrypted.copy(output, 16);
    final.copy(output, 16 + encrypted.length);
    return output;
}

/**
 * PBE-encrypt an input string with a passphrase via {@link encrypt}. The string is encoded as UTF-8 and the encrypted
 * data is returned as a hex-encoded string.
 *
 * @param passphrase the encryption passphrase.
 * @param input the input string.
 */
export function encryptUTF8Hex(passphrase: string, input: string) {
    return encrypt(passphrase, Buffer.from(input, "utf8")).toString("hex");
}

/**
 * Salt used by {@link decrypt} and {@link encrypt}.
 */
const encryptionSalt = "d*X8RHXD%6tSDcjJcymQcRyUSn7^*BBGCeGvv1CgCmsw8EY&BCsavBAafE4$UqgB";
