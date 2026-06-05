import * as SecureStore from 'expo-secure-store';

export interface ReportIssueResponse {
  success: boolean;
  message?: string;
  ticketId?: number;
  error?: string;
}

export async function reportAssetIssue(assetId: string, issueNote: string): Promise<ReportIssueResponse> {
  try {
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    if (!API_URL) {
      throw new Error('API URL is not configured.');
    }

    const token = await SecureStore.getItemAsync('secure_admin_api_key');
    
    if (!token) {
      return { success: false, error: 'Unauthorized: No token found' };
    }

    const response = await fetch(`${API_URL}/api/v1/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assetId, issueNote }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to report issue' };
    }

    return data;
  } catch (error: any) {
    console.error('API Error in reportAssetIssue:', error);
    return { success: false, error: error.message || 'Network error occurred' };
  }
}
