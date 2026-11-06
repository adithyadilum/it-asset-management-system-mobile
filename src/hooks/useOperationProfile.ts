import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchAssetProfile } from '../services/inventory';
import { toMessage } from '../lib/errors';
import type { AssetProfile } from '../types/inventory';
export function useOperationProfile(assetId: string) {
  const [profile, setProfile] = useState<AssetProfile | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    setError('');
    try {
      const next = await fetchAssetProfile(assetId);
      if (request === version.current) setProfile(next);
    } catch (cause) {
      if (request === version.current)
        setError(toMessage(cause, 'Could not refresh this asset.'));
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [assetId]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        version.current++;
      };
    }, [refresh])
  );
  return { profile, loading, error, refresh };
}
