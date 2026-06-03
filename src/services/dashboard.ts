import * as SecureStore from 'expo-secure-store';

export interface DashboardStats {
  assignedAssets: number;
  expiringLicenses: number;
}

export interface DashboardStatsResponse {
  data: DashboardStats;
}

/**
 * Fetches dashboard KPI stats (assigned assets and expiring licenses) from the web API.
 * Uses the mobile JWT stored in SecureStore for authentication.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }

  const token = await SecureStore.getItemAsync('secure_admin_api_key');
  if (!token) {
    throw new Error('Not authenticated. Please re-pair your device.');
  }

  const response = await fetch(`${API_URL}/api/v1/dashboard/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch dashboard stats (status ${response.status})`
    );
  }

  const result: DashboardStatsResponse = await response.json();
  return result.data;
}
