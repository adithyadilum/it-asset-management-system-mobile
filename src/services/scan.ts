import { fetchApi } from '../constants/api';
import { AssetDetailsData, ScanResponse } from '../types/asset';

/**
 * Looks up an asset by its tag, as read from a QR code.
 * Throws on failure — callers should catch rather than inspect a flag.
 */
export async function fetchScannedAssetDetails(
  assetTag: string
): Promise<AssetDetailsData> {
  const result = await fetchApi<ScanResponse>('/api/v1/scan', {
    method: 'POST',
    body: { assetTag },
  });

  if (!result.data) {
    throw new Error('The server returned no details for this asset.');
  }

  return result.data;
}

/**
 * Pushes a scanned barcode to the paired desktop session over Pusher.
 * Throws on failure.
 */
export async function injectBarcode(barcode: string): Promise<void> {
  await fetchApi<unknown>('/api/v1/inject-barcode', {
    method: 'POST',
    body: { barcode },
  });
}
