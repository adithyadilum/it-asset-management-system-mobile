import { fetchApi } from '../constants/api';

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
  const result = await fetchApi<AssetListResponse>('/api/v1/assets/my-assets');

  const pendingAssignments = result.data.filter(
    (a): a is PendingAssignment => a.state === 'pending approval'
  );
  const activeAssets = result.data.filter((a) => a.state !== 'pending approval');

  return { activeAssets, pendingAssignments };
}

/**
 * Acknowledges a pending asset assignment.
 * Calls POST /api/v1/assets/assignments/:id/acknowledge.
 * On success the server sets state = 'assigned' and acceptedAt = now().
 *
 * The verb must be POST: the route is only exported as POST server-side, and it
 * is not idempotent — a second attempt is rejected with 409.
 */
export async function acknowledgeAssignment(
  assignmentId: number
): Promise<void> {
  await fetchApi<unknown>(
    `/api/v1/assets/assignments/${assignmentId}/acknowledge`,
    { method: 'POST' }
  );
}
