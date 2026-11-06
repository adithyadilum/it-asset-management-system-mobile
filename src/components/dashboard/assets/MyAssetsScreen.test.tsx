import React from 'react';
import { Text } from 'react-native';
import MyAssetsScreen from '../../../app/(dashboard)/my-assets';
import { fetchMyAssets } from '../../../services/assets';
const { create, act } = jest.requireActual('react-test-renderer');
jest.mock('../../../services/assets', () => ({
  fetchMyAssets: jest.fn(),
  acknowledgeAssignment: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) =>
    jest.requireActual('react').useEffect(callback, [callback]),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('react-native-reanimated', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const animation = {
    delay: () => animation,
    duration: () => animation,
    springify: () => animation,
  };
  return {
    __esModule: true,
    default: {
      View: ({ entering, ...props }: any) => React.createElement(View, props),
    },
    FadeIn: animation,
    FadeInDown: animation,
  };
});
jest.mock('./AcknowledgmentSheet', () => ({ AcknowledgmentSheet: () => null }));
jest.mock('./AssetDetailsSheet', () => ({ AssetDetailsSheet: () => null }));
jest.mock('../../ui/Button', () => ({ Button: () => null }));
it('shows software-only allocations instead of an empty equipment state', async () => {
  jest.mocked(fetchMyAssets).mockResolvedValue({
    activeAssets: [],
    pendingAssignments: [],
    softwareAssets: [
      {
        allocationId: 21,
        assetId: null,
        tagId: null,
        name: 'Adobe Creative Cloud',
        brand: 'Adobe',
        category: 'Design',
        imageUrl: null,
        allocatedDate: '2026-07-10T09:00:00.000Z',
        licenseType: 'Subscription',
        expiryDate: null,
      },
    ],
  });
  let tree: any;
  await act(async () => {
    tree = create(<MyAssetsScreen />);
  });
  const text = tree.root
    .findAllByType(Text)
    .map((n: any) => n.props.children)
    .flat()
    .join(' ');
  expect(text).toMatch(/Software access \(\s*1\s*\)/);
  expect(text).toContain('Adobe Creative Cloud');
  expect(text).not.toContain('No Assets Assigned');
  expect(fetchMyAssets).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
