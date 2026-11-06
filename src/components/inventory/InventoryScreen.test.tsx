import React from 'react';
import InventoryScreen from '../../app/(dashboard)/inventory';
import { useInventory } from '../../hooks/useInventory';
import { AssetImage } from './AssetImage';
import type { InventoryResponse } from '../../types/inventory';
const { create, act } = jest.requireActual('react-test-renderer');
const mockPush = jest.fn(),
  retry = jest.fn();
const mockRouter = { push: mockPush };
jest.mock('../../hooks/useInventory', () => ({ useInventory: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
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
  AssetImage: jest.fn(() => null),
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

it('keeps existing rows idle during typing and pagination, while updating changed assets', async () => {
  const state = jest.mocked(useInventory)({});
  const first = result.data[0];
  const second = { ...first, id: 'asset-2', assetTag: 'LAP-105' };
  let data = [first, second];
  const show = (loadingMore = false) =>
    jest.mocked(useInventory).mockReturnValue({
      ...state,
      loadingMore,
      result: { ...result, data },
    });
  show();
  let tree: any;
  await act(async () => {
    tree = create(<InventoryScreen />);
  });
  expect(AssetImage).toHaveBeenCalledTimes(2);
  await act(async () => {
    tree.root
      .findAll(
        (node: any) =>
          node.props.accessibilityLabel === 'Search inventory' &&
          typeof node.props.onChangeText === 'function'
      )[0]
      .props.onChangeText('Latitude');
  });
  expect(AssetImage).toHaveBeenCalledTimes(2);
  show(true);
  await act(async () => tree.update(<InventoryScreen />));
  expect(AssetImage).toHaveBeenCalledTimes(2);
  data = [...data, { ...first, id: 'asset-3', assetTag: 'LAP-106' }];
  show();
  await act(async () => tree.update(<InventoryScreen />));
  expect(AssetImage).toHaveBeenCalledTimes(3);
  data = [
    first,
    { ...second, name: 'Updated engineering laptop', status: 'In Repair' },
    data[2],
  ];
  show();
  await act(async () => tree.update(<InventoryScreen />));
  expect(AssetImage).toHaveBeenCalledTimes(4);
  expect(
    tree.root.findAllByProps({ children: 'Updated engineering laptop' }).length
  ).toBeGreaterThan(0);
  await act(async () => tree.unmount());
});
