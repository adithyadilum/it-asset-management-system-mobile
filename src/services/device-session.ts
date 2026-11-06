import type Pusher from 'pusher-js';
import * as PusherModule from 'pusher-js';
import { resolvePusherConstructor } from '../lib/pusher-constructor';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  ApiError,
  fetchApi,
  getStoredToken,
  invalidateSession,
  SessionExpiredError,
} from '../constants/api';
import { decodeJwt } from '../lib/jwt';
import { logger } from '../lib/logger';

export const SESSION_CHECK_INTERVAL_MS = 15_000;

/** Push revocation, with foreground checks to recover missed events and reconnect races. */
export function watchDeviceSession(): () => void {
  let stopped = false,
    foreground =
      AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
    online = true;
  let token: string | null = null,
    checking = false,
    checkAgain = false;
  let client: Pusher | null = null,
    channelName = '';
  let interval: ReturnType<typeof setInterval> | undefined;
  let unsubscribeNetwork: (() => void) | undefined;
  let appSubscription: ReturnType<typeof AppState.addEventListener> | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(interval);
    unsubscribeNetwork?.();
    appSubscription?.remove();
    if (client) {
      if (channelName) client.unsubscribe(channelName);
      client.disconnect();
    }
  };
  const verify = async () => {
    if (stopped || !token || !foreground || !online) return;
    if (checking) {
      checkAgain = true;
      return;
    }
    checking = true;
    try {
      await fetchApi('/api/v1/profile', {
        expectedToken: token,
        cache: 'no-store',
        timeoutMs: 8000,
      });
    } catch (error) {
      if (stopped) return;
      if (error instanceof SessionExpiredError) stop();
      else if (error instanceof ApiError && error.status === 403) {
        const revokedToken = token;
        stop();
        await invalidateSession(revokedToken);
      }
      // Offline, timeout and service outages preserve the pairing and retry later.
    } finally {
      checking = false;
      if (checkAgain) {
        checkAgain = false;
        void verify();
      }
    }
  };
  const sync = () => {
    clearInterval(interval);
    if (stopped || !foreground || !online) return;
    void verify();
    interval = setInterval(() => {
      void verify();
    }, SESSION_CHECK_INTERVAL_MS);
  };
  void (async () => {
    try {
      token = await getStoredToken();
      if (stopped || !token) return;
      appSubscription = AppState.addEventListener('change', (state) => {
        foreground = state === 'active';
        sync();
      });
      unsubscribeNetwork = NetInfo.addEventListener((state) => {
        online = state.isConnected !== false;
        sync();
      });
      sync();
      const jwtId = decodeJwt(token)?.jti;
      const key = process.env.EXPO_PUBLIC_PUSHER_KEY,
        cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;
      if (!jwtId || !key || !cluster) return;
      const sessionToken = token;
      const PusherConstructor = resolvePusherConstructor(PusherModule);
      client = new PusherConstructor(key, {
        cluster,
        forceTLS: true,
        channelAuthorization: {
          customHandler: (params, callback) => {
            if (stopped) return;
            void fetchApi<{ auth: string; channel_data?: string }>(
              '/api/v1/pusher/auth',
              {
                method: 'POST',
                expectedToken: sessionToken,
                timeoutMs: 8000,
                formBody: {
                  socket_id: params.socketId,
                  channel_name: params.channelName,
                },
              }
            )
              .then((result) => {
                if (!stopped) callback(null, result);
              })
              .catch((error) => {
                if (stopped) return;
                callback(
                  new Error('Realtime authorization is unavailable.'),
                  null
                );
                if (error instanceof SessionExpiredError) stop();
                else void verify();
              });
          },
        },
      });
      client.connection.bind('connected', () => {
        void verify();
      });
      channelName = `private-device-${jwtId}`;
      const channel = client.subscribe(channelName);
      channel.bind('pusher:subscription_succeeded', () => {
        void verify();
      });
      channel.bind('pusher:subscription_error', () => {
        void verify();
      });
      channel.bind('device_unlinked', () => {
        if (stopped) return;
        stop();
        void invalidateSession(sessionToken, 'unlinked');
      });
    } catch {
      // Polling remains active when realtime cannot initialize.
      if (!stopped)
        logger.warn(
          'Realtime device monitoring is unavailable; session checks remain active.'
        );
    }
  })();
  return stop;
}
