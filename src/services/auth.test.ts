import { exchangeMobileToken, PairingError } from './auth';
import { fetchApi, RequestTimeoutError } from '../constants/api';
jest.mock('../constants/api', () => {
  const actual = jest.requireActual('../constants/api');
  return {
    ...actual,
    fetchApi: jest.fn(),
    getApiUrl: () => 'http://192.168.8.100:3000',
  };
});
jest.mock('expo-device', () => ({
  brand: 'Samsung',
  modelName: 'Galaxy S24',
  deviceName: 'Office phone',
  osName: 'Android',
  osVersion: '14',
  isDevice: true,
}));
beforeEach(() => jest.clearAllMocks());
it('checks server reachability before spending a pairing code', async () => {
  jest
    .mocked(fetchApi)
    .mockResolvedValueOnce({ status: 'alive' })
    .mockResolvedValueOnce({ accessToken: 'device-jwt' });
  expect(await exchangeMobileToken('a'.repeat(64))).toBe('device-jwt');
  expect(fetchApi).toHaveBeenNthCalledWith(1, '/api/health/live', {
    requiresAuth: false,
    timeoutMs: 4000,
  });
  expect(fetchApi).toHaveBeenNthCalledWith(
    2,
    '/api/auth/mobile-exchange',
    expect.objectContaining({
      requiresAuth: false,
      body: expect.objectContaining({
        token: 'a'.repeat(64),
        deviceModel: 'Galaxy S24',
      }),
    })
  );
});
it('identifies the configured server when it cannot be reached, without consuming the code', async () => {
  jest.mocked(fetchApi).mockRejectedValueOnce(new RequestTimeoutError());
  await expect(exchangeMobileToken('b'.repeat(64))).rejects.toThrow(
    '192.168.8.100'
  );
  expect(fetchApi).toHaveBeenCalledTimes(1);
});
it('identifies a server-side pairing delay after connectivity succeeds', async () => {
  jest
    .mocked(fetchApi)
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new RequestTimeoutError());
  await expect(exchangeMobileToken('c'.repeat(64))).rejects.toThrow(
    'web server was reached'
  );
  expect(fetchApi).toHaveBeenCalledTimes(2);
});
it('rejects a non-pairing QR before issuing requests', async () => {
  await expect(exchangeMobileToken('LAP-001')).rejects.toBeInstanceOf(
    PairingError
  );
  expect(fetchApi).not.toHaveBeenCalled();
});
