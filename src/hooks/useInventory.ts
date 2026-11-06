import { appendUniqueById } from '../lib/list-pages';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchInventory } from '../services/inventory';
import { toMessage } from '../lib/errors';
import type { InventoryFilters, InventoryResponse } from '../types/inventory';

/** One request at a time per view. Blurred views and older filters cannot replace newer results. */
export function useInventory(filters: InventoryFilters) {
  const [result, setResult] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const busy = useRef(false);
  const failedPage = useRef(1);
  const filterKey = JSON.stringify(filters);
  const load = useCallback(
    async (page: number, refresh = false) => {
      if (busy.current) return;
      busy.current = true;
      const request = ++version.current;
      if (page > 1) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      failedPage.current = page;
      try {
        const next = await fetchInventory(JSON.parse(filterKey), page);
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
          setError(toMessage(cause, 'Could not load inventory. Try again.'));
      } finally {
        if (request === version.current) {
          busy.current = false;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [filterKey]
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
