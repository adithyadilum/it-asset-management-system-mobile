import { logger } from '../lib/logger';
import * as Device from 'expo-device';

import {
  fetchApi,
  getApiUrl,
  NetworkError,
  RequestTimeoutError,
  ApiError,
} from '../constants/api';

export class PairingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PairingError';
  }
}

export interface ExchangeResponse {
  token?: string;
  accessToken?: string;
  error?: string;
}

/**
 * Exchanges a mobile pairing token scanned via QR code for an admin API token.
 * Automatically bundles current device metadata.
 */
export async function exchangeMobileToken(
  pairingToken: string
): Promise<string> {
  pairingToken = pairingToken.trim();
  if (!/^[a-f0-9]{64}$/i.test(pairingToken))
    throw new PairingError(
      'This is not a device pairing code. Scan the code from Link Device on the web app.'
    );
  // Probe before consuming the single-use code. A wrong LAN address cannot burn it.
  try {
    await fetchApi('/api/health/live', {
      requiresAuth: false,
      timeoutMs: 4000,
    });
  } catch (error) {
    if (error instanceof NetworkError || error instanceof RequestTimeoutError)
      throw new PairingError(
        `The app could not reach ${getApiUrl()}. For local pairing, use the computer's Wi-Fi address; virtual-adapter and localhost addresses may not be reachable from the phone.`
      );
    if (error instanceof ApiError)
      throw new PairingError(
        'The web server responded but pairing is unavailable. Please try again shortly.'
      );
    throw error;
  }
  let brand = Device.brand
    ? Device.brand.charAt(0).toUpperCase() + Device.brand.slice(1)
    : '';
  let model = Device.modelName || 'Device';

  // If model name is unexpectedly a build fingerprint (contains slashes and colons), try to fallback
  if (model.includes('/') && model.includes(':')) {
    model = Device.designName || Device.productName || 'Android Device';
    model = model.charAt(0).toUpperCase() + model.slice(1);
  }

  // Format Android emulators nicely instead of showing 'sdk_gphone...'
  if (!Device.isDevice && Device.osName?.toLowerCase() === 'android') {
    brand = 'Google';
    model = 'Android Emulator';
  } else if (
    model.toLowerCase().includes('sdk_gphone') ||
    model.toLowerCase().includes('emulator')
  ) {
    brand = 'Google';
    model = 'Android Emulator';
  }

  // Combine brand and model cleanly
  let cleanDeviceName = model;
  if (brand && !model.toLowerCase().includes(brand.toLowerCase())) {
    cleanDeviceName = `${brand} ${model}`;
  }

  let deviceName = Device.deviceName;
  // If no user-defined name, or if it's suspiciously long (often happens on Android), fallback to the clean name
  if (
    !deviceName ||
    deviceName.length > 30 ||
    deviceName === 'Unknown' ||
    deviceName.toLowerCase().includes('sdk')
  ) {
    deviceName = cleanDeviceName;
  }

  let osName = Device.osName || 'Unknown OS';
  if (osName.includes('/')) {
    osName = 'Android'; // Some devices return the build fingerprint in osName
  }

  const deviceOs = `${osName} ${Device.osVersion || ''}`.trim();
  const deviceModel = model;

  let result: ExchangeResponse;
  try {
    result = await fetchApi<ExchangeResponse>('/api/auth/mobile-exchange', {
      method: 'POST',
      requiresAuth: false,
      body: { token: pairingToken, deviceName, deviceOs, deviceModel },
    });
  } catch (error) {
    if (error instanceof RequestTimeoutError)
      throw new PairingError(
        'The web server was reached, but pairing did not finish in time. Generate a new code on the computer and try again.'
      );
    throw error;
  }

  const token = result.token || result.accessToken;
  if (!token) {
    throw new Error('No token received from the server.');
  }

  return token;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarUrl?: string;
}

interface ProfileResponse {
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
}

/** Derives avatar initials from a display name, falling back to the email. */
function deriveInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return email ? email.substring(0, 2).toUpperCase() : '--';
}

/** Fetches the signed-in user's profile for the dashboard header. */
export async function fetchUserProfile(): Promise<UserProfile> {
  const result = await fetchApi<ProfileResponse>('/api/v1/profile');
  const userData = result.data;

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    initials: deriveInitials(userData.name, userData.email),
    avatarUrl: userData.avatarUrl,
  };
}

/**
 * Asks the backend to revoke this device, which also removes it from the
 * Linked Devices table on the web dashboard in real time.
 *
 * Best-effort by design: the caller signs out locally regardless, so a failure
 * here must not block the user from leaving.
 */
export async function unlinkMe(token?: string): Promise<void> {
  try {
    await fetchApi<unknown>('/api/v1/auth/unlink-me', {
      method: 'POST',
      ...(token
        ? { requiresAuth: false, headers: { Authorization: `Bearer ${token}` } }
        : {}),
    });
  } catch (error) {
    logger.error('Failed to notify the server of unlink:', error);
  }
}
