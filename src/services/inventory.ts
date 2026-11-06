import { fetchApi } from '../constants/api';
import type {
  AssetProfile,
  InventoryFilters,
  InventoryResponse,
} from '../types/inventory';

export async function fetchInventory(
  filters: InventoryFilters = {},
  page = 1
): Promise<InventoryResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return fetchApi<InventoryResponse>(`/api/v1/inventory?${params}`);
}
export async function fetchAssetProfile(id: string): Promise<AssetProfile> {
  const result = await fetchApi<{ data: AssetProfile }>(
    `/api/v1/inventory/${encodeURIComponent(id)}`
  );
  return result.data;
}
