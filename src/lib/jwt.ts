/**
 * Minimal Base64url → Base64 decoder polyfill for environments
 * (React Native / Hermes) that may not have a global `atob`.
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function atobPolyfill(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }

  for (let bc = 0, bs = 0, buffer = 0, idx = 0; idx < str.length; idx++) {
    const char = str.charAt(idx);
    const pos = BASE64_CHARS.indexOf(char);
    if (pos === -1) continue;

    buffer = (buffer << 6) + pos;
    bc += 6;

    if (bc >= 8) {
      bc -= 8;
      output += String.fromCharCode((buffer >> bc) & 0xff);
      buffer &= (1 << bc) - 1;
    }
  }

  return output;
}

export interface JwtPayload {
  id?: string;
  role?: string;
  email?: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

/**
 * Decodes the payload of a JWT without verifying the signature.
 * For use in client-side role checks only — signature verification
 * is always performed server-side.
 *
 * @returns The decoded payload object, or `null` if decoding fails.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = typeof atob === 'function' ? atob(base64) : atobPolyfill(base64);

    return JSON.parse(decoded) as JwtPayload;
  } catch (e) {
    console.error('[decodeJwt] Failed to decode JWT payload:', e);
    return null;
  }
}
