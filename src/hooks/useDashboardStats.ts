import { toMessage } from '../lib/errors';
import { logger } from '../lib/logger';
import { useState, useCallback } from 'react';
import { fetchDashboardStats } from '../services/dashboard';
import type { KPIMetric } from '../types';
import {
  Trash2,
  CalendarClock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';

const INITIAL_METRICS: KPIMetric[] = [
  {
    label: 'Pending Disposals',
    value: null,
    icon: Trash2,
    accentColor: Colors.warning,
    accentBg: Colors.warningLight,
  },
  {
    label: 'Software Renewals',
    value: null,
    icon: CalendarClock,
    accentColor: Colors.info,
    accentBg: Colors.infoLight,
  },
  {
    label: 'Overdue Returns',
    value: null,
    icon: AlertTriangle,
    accentColor: Colors.destructive,
    accentBg: Colors.destructiveLight,
  },
  {
    label: 'Warranty Expiry',
    value: null,
    icon: ShieldAlert,
    accentColor: Colors.success,
    accentBg: Colors.successLight,
  },
];

export function useDashboardStats() {
  const [metrics, setMetrics] = useState<KPIMetric[]>(INITIAL_METRICS);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await fetchDashboardStats();
      setMetrics((prev) => [
        { ...prev[0], value: stats.pendingDisposals },
        { ...prev[1], value: stats.softwareRenewals },
        { ...prev[2], value: stats.overdueReturns },
        { ...prev[3], value: stats.warrantyExpiry },
      ]);
    } catch (e) {
      logger.error('Failed to load dashboard stats:', e);
      setError(toMessage(e, 'Could not load dashboard metrics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { metrics, loadStats, loading, error };
}
