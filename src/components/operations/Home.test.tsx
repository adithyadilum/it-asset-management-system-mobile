import React from 'react';
import Home from '../../app/(dashboard)';
import { useTasks } from '../../hooks/useTasks';
const { create, act } = jest.requireActual('react-test-renderer');
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../hooks/useTasks', () => ({ useTasks: jest.fn() }));
jest.mock('../dashboard/Header', () => ({ Header: () => null }));
jest.mock('./TaskRow', () => ({ TaskRow: () => null }));
jest.mock(
  'lucide-react-native',
  () => new Proxy({}, { get: () => () => null })
);
it('routes live Home metrics and handover shortcuts to their actual queues and forms', async () => {
  jest.mocked(useTasks).mockReturnValue({
    result: {
      data: [],
      counts: {
        handovers: 2,
        returns: 4,
        inspections: 1,
        maintenance: 3,
        renewals: 0,
        warranties: 0,
        disposals: 0,
      },
      meta: { page: 1, pageSize: 5, total: 10, totalPages: 2 },
    },
    loading: false,
    refreshing: false,
    loadingMore: false,
    error: '',
    refresh: jest.fn(),
    retry: jest.fn(),
    loadMore: jest.fn(),
  });
  let tree: any;
  await act(async () => {
    tree = create(<Home />);
  });
  const press = (label: string) =>
    tree.root
      .findAll(
        (node: any) =>
          node.props.accessibilityLabel === label &&
          typeof node.props.onPress === 'function'
      )[0]
      .props.onPress();
  await act(async () => press('Launch Scanner'));
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/(dashboard)/scanner',
    params: { operation: '' },
  });
  await act(async () => press('Open Returns due'));
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/(dashboard)/tasks',
    params: { kind: 'returns' },
  });
  await act(async () => press('Hand over'));
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/operations/select-asset',
    params: { operation: 'handover' },
  });
  await act(async () => tree.unmount());
});
