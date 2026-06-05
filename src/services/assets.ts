import * as SecureStore from 'expo-secure-store';

/** A single asset row returned by /api/v1/assets/my-assets */
export interface AssetEntry {
  id: string;
  assignmentId: number;
  name: string;
  tagId: string;
  status: 'new' | 'assigned' | 'lost' | 'disposed' | 'repair';
  /** Raw assignment state from the DB e.g. 'pending approval', 'assigned', 'overdue' */
  state: string;
  category?: string;
  pillar?: string;
  assignedDate?: string;
  /** Expected return date (ISO date string, e.g. '2026-12-31') — null means open-ended */
  expectedReturnDate?: string;
  location?: string;
  assignedByName?: string;
  condition?: string;
}

/** The full response envelope from /api/v1/assets/my-assets */
export interface AssetListResponse {
  data: AssetEntry[];
}

/** An assignment that is waiting for the user's acknowledgment */
export interface PendingAssignment extends AssetEntry {
  state: 'pending approval';
}

/**
 * Fetches all non-returned assets assigned to the current user.
 * Includes both active ('assigned') and pending acknowledgment ('pending approval') entries.
 * Returns { activeAssets, pendingAssignments } split by assignment state.
 *
 * Uses the same mobile JWT + SecureStore pattern as fetchRecentActivity in activity.ts.
 */
export async function fetchMyAssets(): Promise<{
  activeAssets: AssetEntry[];
  pendingAssignments: PendingAssignment[];
}> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }

  const token = await SecureStore.getItemAsync('secure_admin_api_key');
  if (!token) {
    throw new Error('Not authenticated. Please re-pair your device.');
  }

  const response = await fetch(`${API_URL}/api/v1/assets/my-assets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch assets (status ${response.status})`
    );
  }

  const result: AssetListResponse = await response.json();

  const pendingAssignments = result.data.filter(
    (a): a is PendingAssignment => a.state === 'pending approval'
  );
  const activeAssets = result.data.filter(
    (a) => a.state !== 'pending approval'
  );

  return { activeAssets, pendingAssignments };
}

/**
 * Acknowledges a pending asset assignment.
 * Calls PATCH /api/v1/assets/assignments/:id/acknowledge.
 * On success the server sets state = 'assigned' and acceptedAt = now().
 */
export async function acknowledgeAssignment(
  assignmentId: number
): Promise<void> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }

  const token = await SecureStore.getItemAsync('secure_admin_api_key');
  if (!token) {
    throw new Error('Not authenticated. Please re-pair your device.');
  }

  const response = await fetch(
    `${API_URL}/api/v1/assets/assignments/${assignmentId}/acknowledge`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Failed to acknowledge assignment (status ${response.status})`
    );
  }
}
