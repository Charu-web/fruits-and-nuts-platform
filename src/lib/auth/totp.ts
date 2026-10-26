import crypto from "crypto";

/**
 * Standard RFC 6238 TOTP (Time-Based One-Time Password) implementation
 * Using standard 30-second time steps and HMAC-SHA1.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Decodes a Base32 string into a Buffer.
 */
function base32Decode(base32: string): Buffer {
  const clean = base32.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) {
      throw new Error(`Invalid base32 character: ${clean.charAt(i)}`);
    }
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Encodes a Buffer into a Base32 string.
 */
function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, "0");
  }

  let base32 = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    if (chunk.length < 5) {
      base32 += BASE32_ALPHABET[parseInt(chunk.padEnd(5, "0"), 2)];
    } else {
      base32 += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
  }
  return base32;
}

/**
 * Generates a cryptographically secure 160-bit (20 bytes) Base32 TOTP secret.
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Generates a 6-digit TOTP code for a given secret at a specific counter step.
 */
export function generateTotpCode(secretBase32: string, timeStepWindow = 0): string {
  const secretBytes = base32Decode(secretBase32);
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTimeSeconds / 30) + timeStepWindow;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secretBytes);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0xf;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binaryCode % 1000000).toString().padStart(6, "0");
  return otp;
}

/**
 * Verifies a 6-digit TOTP token against a secret with +/- 1 step tolerance (clock drift protection).
 */
export function verifyTotpCode(token: string, secretBase32: string): boolean {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }

  // Check windows: -1 (past 30s), 0 (current 30s), +1 (next 30s)
  for (const windowOffset of [-1, 0, 1]) {
    try {
      const expectedCode = generateTotpCode(secretBase32, windowOffset);
      if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedCode))) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
