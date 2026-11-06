import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Pusher from 'pusher-js';
import {
  watchDeviceSession,
  SESSION_CHECK_INTERVAL_MS,
} from './device-session';
import {
  ApiError,
  fetchApi,
  getStoredToken,
  invalidateSession,
  NetworkError,
  SessionExpiredError,
} from '../constants/api';
const mockChannelHandlers: Record<string, (...args: any[]) => void> = {};
const mockConnectionHandlers: Record<string, () => void> = {};
const mockDisconnect = jest.fn(),
  mockUnsubscribe = jest.fn();
jest.mock('pusher-js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    connection: {
      bind: (event: string, handler: () => void) => {
        mockConnectionHandlers[event] = handler;
      },
    },
    subscribe: jest.fn(() => ({
      bind: (event: string, handler: (...args: any[]) => void) => {
        mockChannelHandlers[event] = handler;
      },
    })),
    disconnect: mockDisconnect,
    unsubscribe: mockUnsubscribe,
  })),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()) },
}));
jest.mock('../constants/api', () => ({
  ...jest.requireActual('../constants/api'),
  getStoredToken: jest.fn(),
  fetchApi: jest.fn(),
  invalidateSession: jest.fn(async () => {}),
}));
const token = `header.${btoa(JSON.stringify({ jti: 'a'.repeat(32) }))}.signature`;
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
let appChange: (state: any) => void;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Object.keys(mockChannelHandlers).forEach(
    (key) => delete mockChannelHandlers[key]
  );
  Object.keys(mockConnectionHandlers).forEach(
    (key) => delete mockConnectionHandlers[key]
  );
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
  });
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, handler) => {
      appChange = handler;
      return { remove: jest.fn() };
    });
  jest.mocked(getStoredToken).mockResolvedValue(token);
  jest.mocked(fetchApi).mockResolvedValue({});
  process.env.EXPO_PUBLIC_PUSHER_KEY = 'public-key';
  process.env.EXPO_PUBLIC_PUSHER_CLUSTER = 'ap1';
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it('immediately ends the original session once on a web unlink and removes listeners', async () => {
  const stop = watchDeviceSession();
  await flush();
  const unlink = mockChannelHandlers.device_unlinked;
  unlink();
  unlink();
  await flush();
  expect(invalidateSession).toHaveBeenCalledTimes(1);
  expect(invalidateSession).toHaveBeenCalledWith(token, 'unlinked');
  expect(mockUnsubscribe).toHaveBeenCalledWith(
    `private-device-${'a'.repeat(32)}`
  );
  expect(mockDisconnect).toHaveBeenCalledTimes(1);
  const calls = jest.mocked(fetchApi).mock.calls.length;
  await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS * 3);
  expect(fetchApi).toHaveBeenCalledTimes(calls);
  stop();
});
it('authorizes private channels through the guarded API client', async () => {
  const stop = watchDeviceSession();
  await flush();
  const options = jest.mocked(Pusher).mock.calls[0][1];
  const callback = jest.fn();
  const auth = options.channelAuthorization as {
    customHandler: (params: unknown, callback: any) => void;
  };
  jest.mocked(fetchApi).mockResolvedValueOnce({ auth: 'signed-auth' });
  auth.customHandler(
    { socketId: '123.456', channelName: `private-device-${'a'.repeat(32)}` },
    callback
  );
  await flush();
  expect(fetchApi).toHaveBeenLastCalledWith(
    '/api/v1/pusher/auth',
    expect.objectContaining({
      method: 'POST',
      expectedToken: token,
      formBody: {
        socket_id: '123.456',
        channel_name: `private-device-${'a'.repeat(32)}`,
      },
    })
  );
  expect(callback).toHaveBeenCalledWith(null, { auth: 'signed-auth' });
  stop();
});
it('checks again after socket subscription, reconnect and resume, without polling in the background or offline', async () => {
  const stop = watchDeviceSession();
  await flush();
  jest.mocked(fetchApi).mockClear();
  mockChannelHandlers['pusher:subscription_succeeded']();
  await flush();
  mockConnectionHandlers.connected();
  await flush();
  expect(fetchApi).toHaveBeenCalledTimes(2);
  appChange('background');
  await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS * 2);
  expect(fetchApi).toHaveBeenCalledTimes(2);
  appChange('active');
  await flush();
  expect(fetchApi).toHaveBeenCalledTimes(3);
  const netChange = jest.mocked(NetInfo.addEventListener).mock.calls[0][0];
  netChange({ isConnected: false } as any);
  await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS * 2);
  expect(fetchApi).toHaveBeenCalledTimes(3);
  netChange({ isConnected: true } as any);
  await flush();
  expect(fetchApi).toHaveBeenCalledTimes(4);
  stop();
});
it('recovers missed push events through foreground checks even without Pusher configuration', async () => {
  delete process.env.EXPO_PUBLIC_PUSHER_KEY;
  const stop = watchDeviceSession();
  await flush();
  expect(Pusher).not.toHaveBeenCalled();
  jest.mocked(fetchApi).mockRejectedValueOnce(new SessionExpiredError());
  await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
  expect(fetchApi).toHaveBeenLastCalledWith(
    '/api/v1/profile',
    expect.objectContaining({ expectedToken: token, cache: 'no-store' })
  );
  expect(jest.getTimerCount()).toBe(0);
  stop();
});
it('keeps the pairing through network errors and server outages, but ends access after a role change', async () => {
  const stop = watchDeviceSession();
  await flush();
  for (const error of [
    new NetworkError('Offline'),
    new ApiError('Unavailable', 503),
  ]) {
    jest.mocked(fetchApi).mockRejectedValueOnce(error);
    await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
  }
  expect(invalidateSession).not.toHaveBeenCalled();
  jest.mocked(fetchApi).mockRejectedValueOnce(new ApiError('Forbidden', 403));
  await jest.advanceTimersByTimeAsync(SESSION_CHECK_INTERVAL_MS);
  expect(invalidateSession).toHaveBeenCalledWith(token);
  stop();
});
it('ignores delayed socket callbacks after the session monitor is disposed', async () => {
  const stop = watchDeviceSession();
  await flush();
  const unlink = mockChannelHandlers.device_unlinked;
  stop();
  unlink();
  await flush();
  expect(invalidateSession).not.toHaveBeenCalled();
});
