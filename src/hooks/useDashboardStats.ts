import { useState, useCallback } from 'react';
import { fetchDashboardStats } from '../services/dashboard';
import type { KPIMetric } from '../types';
import { Trash2, CalendarClock, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { Colors } from '../constants/colors';

const INITIAL_METRICS: KPIMetric[] = [
  {
    label: 'Pending Disposals',
    value: 0,
    icon: Trash2,
    accentColor: Colors.warning,
    accentBg: Colors.warningLight,
  },
  {
    label: 'Software Renewals',
    value: 0,
    icon: CalendarClock,
    accentColor: Colors.info,
    accentBg: Colors.infoLight,
  },
  {
    label: 'Overdue Returns',
    value: 0,
    icon: AlertTriangle,
    accentColor: Colors.destructive,
    accentBg: Colors.destructiveLight,
  },
  {
    label: 'Warranty Expiry',
    value: 0,
    icon: ShieldAlert,
    accentColor: Colors.success,
    accentBg: Colors.successLight,
  },
];

export function useDashboardStats() {
  const [metrics, setMetrics] = useState<KPIMetric[]>(INITIAL_METRICS);

  const loadStats = useCallback(async () => {
    try {
      const stats = await fetchDashboardStats();
      setMetrics((prev) => [
        { ...prev[0], value: stats.pendingDisposals },
        { ...prev[1], value: stats.softwareRenewals },
        { ...prev[2], value: stats.overdueReturns },
        { ...prev[3], value: stats.warrantyExpiry },
      ]);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }, []);

  return { metrics, loadStats };
}
