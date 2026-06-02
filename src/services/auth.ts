import * as Device from 'expo-device';

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
