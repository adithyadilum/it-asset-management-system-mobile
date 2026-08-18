/**
 * Minimal Base64url → Base64 decoder polyfill for environments
 * (React Native / Hermes) that may not have a global `atob`.
 */

import { logger } from './logger';
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
    logger.error('[decodeJwt] Failed to decode JWT payload:', e);
    return null;
  }
}

/** Roles permitted to hold a mobile session. */
const ALLOWED_MOBILE_ROLES = ['GlobalAdmin'] as const;

/**
 * Clock skew allowance. A token within this window of expiring is treated as
 * already expired, so the app does not open a screen it cannot finish loading.
 */
const EXPIRY_SKEW_MS = 60_000;

/**
 * Whether a decoded token can still be used for this session.
 *
 * The mobile JWT is signed with a 30-day lifetime and cannot be refreshed. The
 * guard previously checked only the role, so on day 31 the app still believed
 * it was authenticated: it rendered the dashboard, then every request failed
 * with 401 and there was no route back to pairing.
 */
export function isTokenUsable(payload: JwtPayload | null): boolean {
  if (!payload) return false;

  const role = payload.role as (typeof ALLOWED_MOBILE_ROLES)[number] | undefined;
  if (!role || !ALLOWED_MOBILE_ROLES.includes(role)) return false;

  if (typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 > Date.now() + EXPIRY_SKEW_MS;
}

/** Convenience wrapper: decode a raw token and test it in one step. */
export function isStoredTokenUsable(token: string | null): boolean {
  if (!token) return false;
  return isTokenUsable(decodeJwt(token));
}
