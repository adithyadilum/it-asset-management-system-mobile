import { useState, useCallback } from 'react';
import { fetchRecentActivity, type ActivityLogEntry } from '../services/activity';

export function useRecentActivity() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchRecentActivity();
      setEntries(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entries,
    loading,
    error,
    load,
  };
}
