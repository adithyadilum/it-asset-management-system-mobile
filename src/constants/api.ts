import * as SecureStore from 'expo-secure-store';

/**
 * The single HTTP client for the app.
 *
 * Every service goes through `fetchApi` so that cross-cutting concerns —
 * authentication, session expiry, rate limiting, timeouts — are implemented
 * once rather than seven times. Services report failure by throwing; none of
 * them return a success-shaped object, so a caller can always tell "the server
 * said no" apart from "the request never arrived".
 */

/** The single name under which the mobile JWT is stored in the keychain. */
export const TOKEN_KEY = 'secure_admin_api_key';

const REQUEST_TIMEOUT_MS = 15_000;

/** Any non-2xx response from the API. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Raised when the server rejects our credentials. By the time this is thrown
 * the stored token has already been cleared and the app has been told to
 * return to pairing, so callers only need to render the message.
 */
export class SessionExpiredError extends ApiError {
  constructor(message = 'Your session has expired. Please re-pair this device.') {
    super(message, 401);
    this.name = 'SessionExpiredError';
  }
}

/**
 * Raised when the backend's sliding-window limiter rejects the request.
 *
 * `retryAfterSeconds` is derived from the `X-RateLimit-Reset` header so callers
 * can wait exactly as long as needed rather than guessing or giving up.
 */
export class RateLimitError extends ApiError {
  constructor(public readonly retryAfterSeconds: number) {
    super(
      `Too many requests. Try again in ${retryAfterSeconds}s.`,
      429
    );
    this.name = 'RateLimitError';
  }
}

type UnauthenticatedHandler = () => void;

let onUnauthenticated: UnauthenticatedHandler | null = null;

/**
 * Registers the callback used to return the app to the pairing screen when the
 * server rejects our token. A module-level hook rather than an import so the
 * client stays free of any dependency on React context.
 */
export function setUnauthenticatedHandler(
  handler: UnauthenticatedHandler | null
): void {
  onUnauthenticated = handler;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** RFC1918 ranges, the only non-loopback hosts allowed to serve plaintext. */
const PRIVATE_LAN = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;

/**
 * Resolves and validates the API base URL.
 *
 * The pairing exchange returns a 30-day administrative JWT that is then sent on
 * every request, so plaintext transport exposes a month-long credential to
 * anyone on the same network. HTTPS is required in release builds; during
 * development it is relaxed for loopback and private-LAN hosts only, which is
 * what device testing against a dev server actually needs.
 *
 * Android (API 28+) and iOS ATS both block cleartext in release builds anyway,
 * so this turns a deferred runtime failure into an immediate, explained one.
 */
export function getApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_URL is not a valid URL: ${url}`);
  }

  if (parsed.protocol === 'https:') {
    return url;
  }

  if (!__DEV__) {
    throw new Error(
      'EXPO_PUBLIC_API_URL must use HTTPS in release builds. ' +
        'A plaintext connection would expose the device token.'
    );
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (!LOOPBACK_HOSTS.has(host) && !PRIVATE_LAN.test(host)) {
    throw new Error(
      `Plaintext HTTP is only permitted for local development hosts. ` +
        `Use HTTPS (an ngrok tunnel works) for ${parsed.hostname}.`
    );
  }

  return url;
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  requiresAuth?: boolean;
  /** Serialized to JSON automatically. */
  body?: unknown;
}

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    requiresAuth = true,
    headers: customHeaders,
    body,
    ...restOptions
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> | undefined),
  };

  if (requiresAuth) {
    const token = await getStoredToken();
    if (!token) {
      throw new ApiError('Not authenticated. Please re-pair your device.', 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${endpoint}`, {
      ...restOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    // Distinguish "the network failed" from "the server said no", which the
    // previous per-service implementations collapsed into one message.
    const isTimeout = cause instanceof Error && cause.name === 'TimeoutError';
    throw new Error(
      isTimeout
        ? 'The server took too long to respond. Check your connection and try again.'
        : 'Could not reach the server. Check your connection and try again.'
    );
  }

  if (response.status === 401) {
    // The token is no longer accepted — revoked, expired, or the account was
    // deactivated. Drop it and send the user back to pairing rather than
    // leaving them on a dashboard where every request fails.
    await clearStoredToken();
    onUnauthenticated?.();
    throw new SessionExpiredError(
      await readErrorMessage(
        response,
        'Your session has expired. Please re-pair this device.'
      )
    );
  }

  if (response.status === 429) {
    // `X-RateLimit-Reset` is an absolute epoch-second value; clamp to a sane
    // window so a skewed clock cannot lock the UI out for minutes.
    const reset = Number(response.headers.get('X-RateLimit-Reset') ?? 0);
    const remaining = reset - Math.floor(Date.now() / 1000);
    const retryAfter = Math.min(60, Math.max(1, Number.isFinite(remaining) ? remaining : 1));
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    throw new ApiError(
      await readErrorMessage(
        response,
        `Request failed (status ${response.status})`
      ),
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
