import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import {glob} from "glob";
import {Readable} from "stream";
import {createBrotliDecompress} from "zlib";

/* Passphrase used to encrypt/decrypt test data files. */
const testDataPassphrase = process.env["CCF_TEST_DATA_PASSPHRASE"]?.trim();

/* Expected SHA-256 hash of the test data passphrase, to verify that it is correct. */
const expectedTestDataPassphraseSha256 = "32e29fb92f40ac1c5736583488ac53938d208a770548934cf789bd3af72a3d67";

/**
 * Return the test data passphrase, throwing an exception if it has not been set in the environment.
 */
function requireTestDataPassphrase() {
    if (!canDecryptTextResources()) {
        throw Error("Environment variable [CCF_TEST_DATA_PASSPHRASE] is not defined or is incorrect.");
    }
    return testDataPassphrase!;
}

/**
 * Determine whether we can decrypt encrypted test data files in the current environment. This indicates whether the
 * `CCF_TEST_DATA_PASSPHRASE` environment variable is set and its value is correct per the expected SHA-256 digest.
 */
export function canDecryptTextResources() {
    if (null == testDataPassphrase) {
        return false;
    }
    const hash = crypto.createHash("SHA-256");
    hash.update(testDataPassphrase);
    return expectedTestDataPassphraseSha256 === hash.digest("hex");
}

/**
 * Read an encrypted text resource into a string. The file is assumed to be hex encoded and contain the encryption IV
 * followed by `:`, followed by AES-256 encrypted data. The decrypted data is assumed to be in UTF-8 encoding.
 *
 * This is the inverse of {@link encryptTextResource}.
 *
 * Requires `CCF_TEST_DATA_PASSPHRASE` to be set in the system environment.
 *
 * @param relative path to the file relative to the `__tests__` directory.
 * @return decrypted file contents.
 */
export async function decryptTextResource(relative: string) {
    const passphrase = requireTestDataPassphrase(),
        source = path.join(__dirname, "./", relative);
    return new Promise<string>((resolve, reject) => {
        fs.readFile(source, "utf8", (err, contents) => {
            if (null != err) {
                reject(err);
            }
            resolve(contents);
        });
    }).then(contents => {
        const [ivHex, encryptedHex] = contents.split(":"),
            iv = Buffer.from(ivHex, "hex"),
            decrypt = crypto.createDecipheriv("aes256", passphrase, iv);
        return decrypt.update(encryptedHex, "hex", "utf8") + decrypt.final("utf8");
    });
}

/**
 * Encrypt all files matching a glob pattern via {@link decryptTextResource}.
 *
 * Requires `CCF_TEST_DATA_PASSPHRASE` to be set in the system environment.
 *
 * @param pattern the glob pattern identifying files to encrypt.
 * @return array of pairs of source (original) file paths to target (encrypted) file paths.
 */
export async function encryptMatchingTextResources(pattern: string) {
    const base = path.resolve(__dirname, "./"),
        prefix = base.replace(/\\/g, "/"),
        paths = await glob(`${prefix}/${pattern}`);
    return Promise.all(paths.map(source =>
        encryptTextResource(path.relative(base, source))
            .then(target => [source, target] as const)));
}

/**
 * Decrypt a text string which has been encrypted via {@link encryptText}. Requires the test data passphrase to be
 * present in the environment.
 *
 * @param encrypted the encrypted text string.
 */
export function decryptText(encrypted: string) {
    const [ivHex, encryptedHex] = encrypted.split(":"),
        iv = Buffer.from(ivHex, "hex"),
        decrypt = crypto.createDecipheriv("aes256", requireTestDataPassphrase(), iv);
    return decrypt.update(encryptedHex, "hex", "utf8") + decrypt.final("utf8");
}

/**
 * Encrypt a text string using the test data passphrase, which must be present in the environment. The string can be
 * decrypted via {@link decryptText}.
 *
 * @param text the text string to encrypt.
 */
export function encryptText(text: string) {
    const key = Buffer.from(requireTestDataPassphrase(), "utf8"),
        iv = crypto.randomBytes(16),
        encrypt = crypto.createCipheriv("aes256", key, iv),
        encrypted = encrypt.update(text, "utf8", "hex") + encrypt.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Encrypt a file such that it is suitable for decryption via {@link decryptTextResource}. The encrypted file will be
 * created in the same directory as the original file, with `.enc` appended to the filename.
 *
 * Requires `CCF_TEST_DATA_PASSPHRASE` to be set in the system environment.
 *
 * @param relative path to the file relative to the `__tests__` directory.
 * @return full path to the encrypted file.
 */
export async function encryptTextResource(relative: string) {
    const passphrase = requireTestDataPassphrase(),
        key = Buffer.from(passphrase, "utf8"),
        source = path.join(__dirname, "./", relative),
        target = `${source}.enc`;
    return new Promise<string>((resolve, reject) => {
        fs.readFile(source, "utf8", (err, contents) => {
            if (null != err) {
                reject(err);
            }
            resolve(contents);
        });
    }).then(contents => {
        const iv = crypto.randomBytes(16),
            encrypt = crypto.createCipheriv("aes256", key, iv),
            encrypted = encrypt.update(contents, "utf8", "hex") + encrypt.final("hex"),
            ivAndEncrypted = `${iv.toString("hex")}:${encrypted}`;
        return new Promise<string>((resolve, reject) => fs.writeFile(target, ivAndEncrypted, err => {
            if (null != err) {
                reject(err);
            }
            resolve(target);
        }));
    })
}

/**
 * Read the contents of one or more binary files.
 *
 * If the matched file(s) have any of the following filename extensions, they are transformed appropriately before they
 * are returned:
 *
 * * `.br` the file will be Brotli decompressed.
 *
 * @param relative the glob, relative to the `__tests__` directory, matching files to read.
 */
export async function readResources(relative: string) {
    const pattern = path.resolve(__dirname, "./", relative),
        matches = await glob(pattern.replace(/\\/g, "/"));
    return Promise.all(matches.map(match =>
        new Promise<[path.ParsedPath, Buffer]>((resolve, reject) => {

            /* Get the file size. */
            const parsedPath = path.parse(match);
            fs.stat(match, (ex, {size}) => {
                if (null != ex) {
                    reject(ex);
                } else {

                    /* Open a stream on the match. Pipe through a decompressor if necessary. */
                    let input: Readable = fs.createReadStream(match);
                    if (".br" === parsedPath.ext) {
                        input = input.pipe(createBrotliDecompress());
                    }

                    /* Read the stream. */
                    const buffer = Buffer.alloc(size);
                    let pos = 0;
                    input.on("end", () => {
                        resolve([path.parse(match), buffer]);
                    }).on("error", err => {
                        reject(err);
                    }).on("data", (data: Buffer) => {
                        pos += data.copy(buffer, pos, 0);
                    });
                }
            });
        })));
}

/**
 * Read the contents of one or more UTF-8 text files.
 *
 * If the matched file(s) have any of the following filename extensions, they are transformed appropriately before they
 * are returned:
 *
 * * `.br` the file will be Brotli decompressed.
 *
 * @param relative the glob, relative to the `__tests__` directory, matching files to read.
 */
export async function readUtf8TextResources(relative: string) {
    const pattern = path.resolve(__dirname, "./", relative),
        matches = await glob(pattern.replace(/\\/g, "/"));
    return Promise.all(matches.map(match =>
        new Promise<[path.ParsedPath, string]>((resolve, reject) => {

            /* Open a stream on the match. Pipe through a decompressor if necessary. */
            let input: Readable = fs.createReadStream(match);
            const parsedPath = path.parse(match);
            if (".br" === parsedPath.ext) {
                input = input.pipe(createBrotliDecompress());
            }

            /* Read the stream. */
            let content = "";
            input.on("end", () => {
                resolve([path.parse(match), content]);
            }).on("error", err => {
                reject(err);
            }).on("data", data => {
                content += data;
            });
        })));
}
