import { fetchApi } from '../constants/api';
import { fetchAssetProfile, fetchInventory } from './inventory';
jest.mock('../constants/api', () => ({ fetchApi: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it('encodes search and combined filters without serializing empty filters', async () => {
  jest.mocked(fetchApi).mockResolvedValueOnce({ data: [] });
  await fetchInventory(
    {
      query: 'Dell SN_10% & new',
      pillar: 'Hardware',
      categoryId: 4,
      locationId: 3,
      status: 'In Repair',
    },
    2
  );
  const endpoint = jest.mocked(fetchApi).mock.calls[0][0];
  const url = new URL(endpoint, 'https://example.test');
  expect(url.searchParams.get('query')).toBe('Dell SN_10% & new');
  expect(url.searchParams.get('page')).toBe('2');
  expect(url.searchParams.get('categoryId')).toBe('4');
  expect(url.searchParams.get('status')).toBe('In Repair');
  await fetchInventory({ query: '', locationId: undefined });
  expect(fetchApi).toHaveBeenLastCalledWith(
    '/api/v1/inventory?page=1&pageSize=20'
  );
});
it('returns the profile envelope and preserves server failures', async () => {
  const profile = { asset: { id: 'asset-1' } };
  jest.mocked(fetchApi).mockResolvedValueOnce({ data: profile });
  expect(await fetchAssetProfile('asset-1')).toEqual(profile);
  jest.mocked(fetchApi).mockRejectedValueOnce(new Error('Asset not found'));
  await expect(fetchAssetProfile('missing')).rejects.toThrow('Asset not found');
});
