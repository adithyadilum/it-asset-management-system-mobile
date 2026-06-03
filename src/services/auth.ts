import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';


export interface ExchangeResponse {
  token?: string;
  accessToken?: string;
  error?: string;
}

/**
 * Exchanges a mobile pairing token scanned via QR code for an admin API token.
 * Automatically bundles current device metadata.
 */
export async function exchangeMobileToken(pairingToken: string): Promise<string> {
  const deviceName = Device.modelName || 'Unknown Device';
  const deviceOs = `${Device.osName} ${Device.osVersion}`;
  const deviceModel = Device.designName || Device.modelName || 'Unknown Model';

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured in the environment.');
  }

  const response = await fetch(`${API_URL}/api/auth/mobile-exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: pairingToken,
      deviceName,
      deviceOs,
      deviceModel,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Exchange failed with status ${response.status}`);
  }

  const result: ExchangeResponse = await response.json();
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

/**
 * Fetches the current logged-in user profile from the web API
 * and computes initials for avatar rendering.
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }

  const token = await SecureStore.getItemAsync('secure_admin_api_key');
  if (!token) {
    throw new Error('Not authenticated. Please re-pair your device.');
  }

  const response = await fetch(`${API_URL}/api/v1/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch user profile (status ${response.status})`
    );
  }

  const result = await response.json();
  const userData = result.data;

  // Calculate initials from the full name
  let initials = '';
  if (userData.name) {
    const parts = userData.name.trim().split(/\s+/);
    initials = parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else {
    initials = userData.email ? userData.email.substring(0, 2).toUpperCase() : '--';
  }

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    initials,
    avatarUrl: userData.avatarUrl,
  };
}
