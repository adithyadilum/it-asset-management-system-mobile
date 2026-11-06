import React from 'react';
import InventoryScreen from '../../app/(dashboard)/inventory';
import { useInventory } from '../../hooks/useInventory';
import type { InventoryResponse } from '../../types/inventory';
const { create, act } = jest.requireActual('react-test-renderer');
const mockPush = jest.fn(),
  retry = jest.fn();
jest.mock('../../hooks/useInventory', () => ({ useInventory: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock(
  'lucide-react-native',
  () => new Proxy({}, { get: () => () => null })
);
jest.mock('../../components/inventory/InventoryFiltersSheet', () => ({
  InventoryFiltersSheet: () => null,
}));
jest.mock('../../components/inventory/AssetImage', () => ({
  AssetImage: () => null,
}));
const result: InventoryResponse = {
  data: [
    {
      id: 'asset-1',
      assetTag: 'LAP-104',
      name: 'Engineering laptop',
      model: 'Latitude 5440',
      brand: 'Dell',
      category: 'Laptops',
      pillar: 'Hardware',
      imageUrl: null,
      serialNumber: 'SN104',
      status: 'Assigned',
      condition: 'Good',
      location: 'Colombo',
      assignedTo: 'Nimasha Perera',
    },
  ],
  meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
  filters: { categories: [], locations: [], statuses: [] },
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useInventory).mockReturnValue({
    result,
    loading: false,
    refreshing: false,
    loadingMore: false,
    error: '',
    refresh: jest.fn(),
    retry,
    loadMore: jest.fn(),
  });
});
it('opens a full profile from a search result and debounces search input', async () => {
  jest.useFakeTimers();
  let tree: any;
  await act(async () => {
    tree = create(<InventoryScreen />);
  });
  expect(
    tree.root.findAllByProps({ children: 'Engineering laptop' }).length
  ).toBeGreaterThan(0);
  await act(async () => {
    tree.root
      .findAll(
        (node: any) =>
          node.props.accessibilityLabel ===
            'View LAP-104, Engineering laptop' &&
          typeof node.props.onPress === 'function'
      )[0]
      .props.onPress();
  });
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/asset/[assetId]',
    params: { assetId: 'asset-1' },
  });
  await act(async () => {
    tree.root
      .findAll(
        (node: any) =>
          node.props.accessibilityLabel === 'Search inventory' &&
          typeof node.props.onChangeText === 'function'
      )[0]
      .props.onChangeText('Dell');
  });
  expect(useInventory).toHaveBeenLastCalledWith({ query: '' });
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(useInventory).toHaveBeenLastCalledWith({ query: 'Dell' });
  await act(async () => tree.unmount());
  jest.useRealTimers();
});
it('shows an actionable empty state instead of an empty list', async () => {
  jest.mocked(useInventory).mockReturnValue({
    ...jest.mocked(useInventory)({}),
    result: { ...result, data: [], meta: { ...result.meta, total: 0 } },
  });
  let tree: any;
  await act(async () => {
    tree = create(<InventoryScreen />);
  });
  expect(
    tree.root.findAllByProps({ children: 'No assets found' }).length
  ).toBeGreaterThan(0);
  await act(async () => tree.unmount());
});
