import React, { useEffect } from 'react';
import { useInventory } from './useInventory';
import { fetchInventory } from '../services/inventory';
import type { InventoryFilters, InventoryResponse } from '../types/inventory';
const { create, act } = jest.requireActual('react-test-renderer');
jest.mock('../services/inventory', () => ({ fetchInventory: jest.fn() }));
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) =>
    jest.requireActual('react').useEffect(effect, [effect]),
}));
let current: ReturnType<typeof useInventory>;
function Harness({ filters }: { filters: InventoryFilters }) {
  const value = useInventory(filters);
  useEffect(() => {
    current = value;
  }, [value]);
  return null;
}
function page(pageNumber: number, ids: string[]): InventoryResponse {
  return {
    data: ids.map((id) => ({ id, assetTag: id })) as InventoryResponse['data'],
    meta: { total: 4, page: pageNumber, pageSize: 2, totalPages: 2 },
    filters: { categories: [], locations: [], statuses: [] },
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(() => jest.clearAllMocks());
it('ignores an older search response after the filter changes', async () => {
  const old = deferred<InventoryResponse>();
  jest
    .mocked(fetchInventory)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(page(1, ['new-result']));
  let tree: any;
  await act(async () => {
    tree = create(<Harness filters={{ query: 'old' }} />);
  });
  await act(async () => {
    tree.update(<Harness filters={{ query: 'new' }} />);
  });
  expect(current.result?.data[0].id).toBe('new-result');
  await act(async () => old.resolve(page(1, ['old-result'])));
  expect(current.result?.data[0].id).toBe('new-result');
  await act(async () => tree.unmount());
});
it('blocks duplicate page loads, retains results after a failure, and retries the same page', async () => {
  const next = deferred<InventoryResponse>();
  jest
    .mocked(fetchInventory)
    .mockResolvedValueOnce(page(1, ['a', 'b']))
    .mockReturnValueOnce(next.promise);
  let tree: any;
  await act(async () => {
    tree = create(<Harness filters={{}} />);
  });
  await act(async () => {
    current.loadMore();
    current.loadMore();
  });
  expect(fetchInventory).toHaveBeenCalledTimes(2);
  await act(async () => next.reject(new Error('Connection interrupted')));
  expect(current.result?.data.map((row) => row.id)).toEqual(['a', 'b']);
  expect(current.error).toBe('Connection interrupted');
  jest.mocked(fetchInventory).mockResolvedValueOnce(page(2, ['b', 'c']));
  await act(async () => {
    await current.retry();
  });
  expect(fetchInventory).toHaveBeenLastCalledWith({}, 2);
  expect(current.result?.data.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  await act(async () => tree.unmount());
});
it('retries page one when a refresh fails instead of advancing pagination', async () => {
  jest
    .mocked(fetchInventory)
    .mockResolvedValueOnce(page(1, ['a', 'b']))
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce(page(1, ['updated']));
  let tree: any;
  await act(async () => {
    tree = create(<Harness filters={{}} />);
  });
  await act(async () => {
    await current.refresh();
  });
  await act(async () => {
    await current.retry();
  });
  expect(fetchInventory).toHaveBeenLastCalledWith({}, 1);
  expect(current.result?.data.map((row) => row.id)).toEqual(['updated']);
  await act(async () => tree.unmount());
});
