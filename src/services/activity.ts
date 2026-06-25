import { fetchApi } from '../constants/api';

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
  const result = await fetchApi<RecentActivityResponse>('/api/v1/activity/recent');
  return result.data;
}
