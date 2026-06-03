import * as SecureStore from 'expo-secure-store';

/** A single activity row returned by /api/v1/activity/recent */
export interface ActivityLogEntry {
  id: number;
  /** Raw action type, e.g. "CREATE", "ASSIGN", "LOGIN" */
  action: string;
  /** Human-readable event description, e.g. "Changed status from [Available] → [Assigned]" */
  event: string;
  entityType: string;
  entityLabel: string;
  performedBy: { name: string; email: string } | null;
  performedAt: string;
}

export interface RecentActivityResponse {
  data: ActivityLogEntry[];
}

/**
 * Fetches recent system audit log entries from the web API.
 * Uses the mobile JWT stored in SecureStore for authentication.
 */
export async function fetchRecentActivity(): Promise<ActivityLogEntry[]> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }

  const token = await SecureStore.getItemAsync('secure_admin_api_key');
  if (!token) {
    throw new Error('Not authenticated. Please re-pair your device.');
  }

  const response = await fetch(`${API_URL}/api/v1/activity/recent`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch activity (status ${response.status})`
    );
  }

  const result: RecentActivityResponse = await response.json();
  return result.data;
}
