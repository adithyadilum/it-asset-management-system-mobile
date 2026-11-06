import { appendUniqueById } from '../lib/list-pages';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchTasks, type TaskFilters } from '../services/operations';
import type { TaskPage } from '../types/operations';
import { toMessage } from '../lib/errors';
export function useTasks(filters: TaskFilters = {}) {
  const [result, setResult] = useState<TaskPage | null>(null),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [loadingMore, setLoadingMore] = useState(false),
    [error, setError] = useState('');
  const version = useRef(0),
    busy = useRef(false),
    failedPage = useRef(1);
  const key = JSON.stringify(filters);
  const load = useCallback(
    async (page: number, refresh = false) => {
      if (busy.current) return;
      busy.current = true;
      const request = ++version.current;
      failedPage.current = page;
      setError('');
      if (page > 1) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const next = await fetchTasks(JSON.parse(key), page);
        if (request !== version.current) return;
        setResult((previous) => ({
          ...next,
          data:
            page > 1 && previous
              ? appendUniqueById(previous.data, next.data)
              : next.data,
        }));
      } catch (cause) {
        if (request === version.current)
          setError(toMessage(cause, 'Could not load tasks. Please try again.'));
      } finally {
        if (request === version.current) {
          busy.current = false;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [key]
  );
  useFocusEffect(
    useCallback(() => {
      busy.current = false;
      void load(1);
      return () => {
        version.current++;
        busy.current = false;
      };
    }, [load])
  );
  const refresh = useCallback(() => load(1, true), [load]);
  const retry = useCallback(() => load(failedPage.current), [load]);
  const loadMore = useCallback(
    () =>
      result && result.meta.page < result.meta.totalPages && !error
        ? load(result.meta.page + 1)
        : undefined,
    [result, error, load]
  );
  return {
    result,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    retry,
    loadMore,
  };
}
