package etc;

import javax.crypto.Cipher;
import javax.crypto.CipherOutputStream;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Random;
import java.util.regex.Pattern;

import static java.nio.charset.StandardCharsets.UTF_8;
import static javax.crypto.Cipher.DECRYPT_MODE;
import static javax.crypto.Cipher.ENCRYPT_MODE;

/**
 * {@link TestEncryptionUtils} implements encryption and decryption helpers which are compatible with JavaScript
 * equivalents in `test-encryption-utils.ts`.
 */
public class TestEncryptionUtils {

    /**
     * PBE-decrypt data which was previously encrypted via {@link #encrypt(String, InputStream, OutputStream)}.
     *
     * @param passphrase the encryption passphrase.
     * @param input the encrypted data.
     * @param output the decryption target.
     */
    public static void decrypt(final String passphrase, final InputStream input,
            final OutputStream output) {
        try {
            final var iv = new byte[16];
            var count = 0;
            while (count < iv.length) {
                count += input.read(iv, count, iv.length - count);
            }
            cipher(passphrase, iv, DECRYPT_MODE, input, output);
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * PBE-decrypt a string which was previously encrypted via {@link #encryptUTF8Hex(String, String)}.
     *
     * @param passphrase the encryption passphrase.
     * @param inputHex the encrypted string.
     */
    public static String decryptUTF8Hex(final String passphrase, final String inputHex) {
        try {
            final var output = new ByteArrayOutputStream(1024);
            try (output; final var input = new ByteArrayInputStream(
                    hex.parseHex(whitespace.matcher(inputHex).replaceAll("")))) {
                decrypt(passphrase, input, output);
            }
            return output.toString(UTF_8);
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * PBE-encrypt data with a given passphrase. Writes encrypted data to the provided output stream consisting of a
     * 16-byte randomly generated cipher initialization vector followed by the encrypted data. Use
     * {@link #decrypt(String, InputStream, OutputStream)} to decrypt this data.
     *
     * @param passphrase the encryption passphrase.
     * @param input the input data.
     * @param output the output target.
     */
    public static void encrypt(final String passphrase, final InputStream input,
            final OutputStream output) {
        try {
            final var iv = new byte[16];
            random.nextBytes(iv);
            output.write(iv);
            cipher(passphrase, iv, ENCRYPT_MODE, input, output);
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * PBE-encrypt an input string with a passphrase via {@link #encrypt(String, InputStream, OutputStream)}. The string
     * is encoded as UTF-8 and the encrypted data is returned as a hex-encoded string.
     *
     * @param passphrase the encryption passphrase.
     * @param inputString the input string.
     */
    public static String encryptUTF8Hex(final String passphrase, final String inputString) {
        try {
            final var output = new ByteArrayOutputStream(1024);
            try (output; final var input = new ByteArrayInputStream(inputString.getBytes(UTF_8))) {
                encrypt(passphrase, input, output);
            }
            return hex.formatHex(output.toByteArray());
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Create a {@link Cipher} and encrypt or decrypt from an {@link InputStream} to an {@link OutputStream}.
     *
     * @param passphrase the passphrase.
     * @param iv the initialization vector.
     * @param mode the cipher mode.
     * @param input the input stream.
     * @param output the output stream.
     */
    private static void cipher(final String passphrase, final byte[] iv, final int mode, final InputStream input,
            final OutputStream output) {
        try {
            final var factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            final var keySpec = new PBEKeySpec(passphrase.toCharArray(), encryptionSalt,
                    65_536, 256);
            final var key = new SecretKeySpec(factory.generateSecret(keySpec).getEncoded(), "AES");
            final var cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING");
            cipher.init(mode, key, new IvParameterSpec(iv));
            try (final var cipherOutput = new CipherOutputStream(output, cipher)) {
                final var buffer = new byte[1024];
                var count = 0;
                while (-1 != (count = input.read(buffer))) {
                    cipherOutput.write(buffer, 0, count);
                }
            }
        } catch (final Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Salt used when encrypting data via {@link #encrypt(String, InputStream, OutputStream)} and
     * {@link #decrypt(String, InputStream, OutputStream)} and their downstream convenience methods.
     */
    private static final byte[] encryptionSalt =
            "d*X8RHXD%6tSDcjJcymQcRyUSn7^*BBGCeGvv1CgCmsw8EY&BCsavBAafE4$UqgB".getBytes(UTF_8);

    /**
     * Hex codec.
     */
    private static final HexFormat hex = HexFormat.of();

    /**
     * Random number generator for encryption.
     */
    private static final Random random;

    static {
        try {
            random = SecureRandom.getInstanceStrong();
        } catch (final NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Pattern used to remove whitespace from hex encoded strings.
     */
    private static final Pattern whitespace = Pattern.compile("\\s+");
}
