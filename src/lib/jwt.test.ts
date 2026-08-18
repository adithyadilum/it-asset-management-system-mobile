import { decodeJwt, isStoredTokenUsable, isTokenUsable } from './jwt';

/** Builds an unsigned JWT with the given payload; only the payload is decoded. */
function makeToken(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

const inDays = (days: number) =>
  Math.floor((Date.now() + days * 24 * 60 * 60 * 1000) / 1000);

describe('decodeJwt', () => {
  it('decodes the payload of a well-formed token', () => {
    const token = makeToken({ id: 'user-1', role: 'GlobalAdmin', exp: 123 });

    expect(decodeJwt(token)).toMatchObject({
      id: 'user-1',
      role: 'GlobalAdmin',
      exp: 123,
    });
  });

  it('returns null for a malformed token rather than throwing', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
    expect(decodeJwt('')).toBeNull();
  });
});

describe('isTokenUsable', () => {
  it('accepts a GlobalAdmin token that is still valid', () => {
    expect(isTokenUsable({ role: 'GlobalAdmin', exp: inDays(30) })).toBe(true);
  });

  it('rejects an expired token', () => {
    // M-03: the guard previously checked only the role, so a 31-day-old token
    // kept the app on the dashboard while every request returned 401.
    expect(isTokenUsable({ role: 'GlobalAdmin', exp: inDays(-1) })).toBe(false);
  });

  it('rejects a token expiring within the clock-skew window', () => {
    const inThirtySeconds = Math.floor((Date.now() + 30_000) / 1000);

    expect(isTokenUsable({ role: 'GlobalAdmin', exp: inThirtySeconds })).toBe(
      false
    );
  });

  it('rejects a token with no expiry claim', () => {
    expect(isTokenUsable({ role: 'GlobalAdmin' })).toBe(false);
  });

  it('rejects a non-admin role', () => {
    expect(isTokenUsable({ role: 'Employee', exp: inDays(30) })).toBe(false);
    expect(isTokenUsable({ role: 'ITOperator', exp: inDays(30) })).toBe(false);
  });

  it('rejects a null payload', () => {
    expect(isTokenUsable(null)).toBe(false);
  });
});

describe('isStoredTokenUsable', () => {
  it('accepts a valid stored token', () => {
    const token = makeToken({ role: 'GlobalAdmin', exp: inDays(10) });

    expect(isStoredTokenUsable(token)).toBe(true);
  });

  it('rejects an expired stored token', () => {
    const token = makeToken({ role: 'GlobalAdmin', exp: inDays(-1) });

    expect(isStoredTokenUsable(token)).toBe(false);
  });

  it('rejects an absent token', () => {
    expect(isStoredTokenUsable(null)).toBe(false);
  });
});
