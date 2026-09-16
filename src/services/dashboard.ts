import { fetchApi } from '../constants/api';

export interface DashboardStats {
  pendingDisposals: number;
  softwareRenewals: number;
  overdueReturns: number;
  warrantyExpiry: number;
}

interface DashboardStatsResponse {
  data: DashboardStats;
}

/** Fetches the system-wide KPI counters shown on the dashboard. */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const result = await fetchApi<DashboardStatsResponse>(
    '/api/v1/dashboard/stats'
  );
  return result.data;
}
