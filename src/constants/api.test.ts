import * as SecureStore from 'expo-secure-store';

import {
  ApiError,
  RateLimitError,
  SessionExpiredError,
  TOKEN_KEY,
  fetchApi,
  getApiUrl,
  setUnauthenticatedHandler,
} from './api';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    headers: new Headers(init.headers ?? {}),
    json: async () => body,
  } as unknown as Response;
}

const ORIGINAL_API_URL = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
  mockSecureStore.getItemAsync.mockResolvedValue('a-token');
  setUnauthenticatedHandler(null);
});

afterAll(() => {
  process.env.EXPO_PUBLIC_API_URL = ORIGINAL_API_URL;
});

describe('getApiUrl', () => {
  it('accepts an HTTPS URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://assets.example.com';

    expect(getApiUrl()).toBe('https://assets.example.com');
  });

  it('throws when the variable is missing', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(() => getApiUrl()).toThrow('not configured');
  });

  it('throws on a malformed URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'not a url';

    expect(() => getApiUrl()).toThrow('not a valid URL');
  });

  it('allows plaintext for a private-LAN host in development', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.10:3000';

    expect(getApiUrl()).toBe('http://192.168.1.10:3000');
  });

  it('allows plaintext for loopback in development', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

    expect(getApiUrl()).toBe('http://localhost:3000');
  });

  it('rejects plaintext to a public host even in development', () => {
    // M-02: a 30-day admin token must never cross a public network in clear.
    process.env.EXPO_PUBLIC_API_URL = 'http://assets.example.com';

    expect(() => getApiUrl()).toThrow('local development hosts');
  });
});

describe('fetchApi', () => {
  it('attaches the bearer token and parses the body', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ data: 'ok' }));

    const result = await fetchApi<{ data: string }>('/api/v1/thing');

    expect(result).toEqual({ data: 'ok' });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer a-token');
  });

  it('serializes a body and does not send one when omitted', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}));

    await fetchApi('/api/v1/thing', { method: 'POST', body: { a: 1 } });
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toBe('{"a":1}');

    await fetchApi('/api/v1/thing', { method: 'POST' });
    expect((global.fetch as jest.Mock).mock.calls[1][1].body).toBeUndefined();
  });

  it('skips auth when requiresAuth is false', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}));

    await fetchApi('/api/auth/mobile-exchange', {
      method: 'POST',
      requiresAuth: false,
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
    expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it('throws without calling the network when no token is stored', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    global.fetch = jest.fn();

    await expect(fetchApi('/api/v1/thing')).rejects.toBeInstanceOf(ApiError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces the server error message on a 4xx', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'Forbidden' }, { status: 403 }));

    await expect(fetchApi('/api/v1/thing')).rejects.toThrow('Forbidden');
  });

  it('clears the token and notifies the app on 401', async () => {
    // M-09: the app must return to pairing rather than sit on a dashboard
    // where every request fails.
    const onUnauthenticated = jest.fn();
    setUnauthenticatedHandler(onUnauthenticated);
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, { status: 401 }));

    await expect(fetchApi('/api/v1/thing')).rejects.toBeInstanceOf(
      SessionExpiredError
    );
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    expect(onUnauthenticated).toHaveBeenCalled();
  });

  it('reports the retry delay from the reset header on 429', async () => {
    // M-06: the scanner uses this to pause rather than stack modal alerts.
    const resetAt = Math.floor(Date.now() / 1000) + 20;
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Reset': String(resetAt) } }
      )
    );

    await expect(fetchApi('/api/v1/scan')).rejects.toBeInstanceOf(
      RateLimitError
    );
  });

  it('clamps an absent or skewed reset header to a sane delay', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({}, { status: 429 }));

    await expect(fetchApi('/api/v1/scan')).rejects.toMatchObject({
      retryAfterSeconds: 1,
    });
  });

  it('reports a network failure distinctly from a server rejection', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchApi('/api/v1/thing')).rejects.toThrow(
      'Could not reach the server'
    );
  });

  it('reports a timeout distinctly', async () => {
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeout);

    await expect(fetchApi('/api/v1/thing')).rejects.toThrow('took too long');
  });
});
