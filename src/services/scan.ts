import * as SecureStore from 'expo-secure-store';
import { ScanResponse } from '../types/asset';

// We should use the same base URL configured for the app
export async function fetchScannedAssetDetails(assetTag: string): Promise<ScanResponse> {
  try {
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    if (!API_URL) {
      throw new Error('API URL is not configured.');
    }

    const token = await SecureStore.getItemAsync('secure_admin_api_key');
    
    if (!token) {
      return { success: false, error: 'Unauthorized: No token found' };
    }

    const response = await fetch(`${API_URL}/api/v1/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assetTag }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to scan asset' };
    }

    return data;
  } catch (error: any) {
    console.error('API Error in fetchScannedAssetDetails:', error);
    return { success: false, error: error.message || 'Network error occurred' };
  }
}
