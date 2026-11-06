import React from 'react';
import { Text } from 'react-native';
import { SoftwareAssetRow, softwareExpiry } from './SoftwareAssetRow';
import type { SoftwareAssetEntry } from '../../../services/assets';
const { create, act } = jest.requireActual('react-test-renderer');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0 }),
}));
const seat: SoftwareAssetEntry = {
  allocationId: 18,
  assetId: null,
  tagId: null,
  name: 'Microsoft 365 Business',
  brand: 'Microsoft',
  category: 'Productivity',
  imageUrl: null,
  allocatedDate: '2026-03-02T09:00:00.000Z',
  licenseType: 'Subscription',
  expiryDate: '2026-11-05',
};
it('opens allocated software details without equipment custody actions', async () => {
  let tree: any;
  await act(async () => {
    tree = create(<SoftwareAssetRow asset={seat} />);
  });
  await act(async () => {
    tree.root
      .findAll(
        (n: any) =>
          n.props.accessibilityLabel === `View software ${seat.name}` &&
          typeof n.props.onPress === 'function'
      )[0]
      .props.onPress();
  });
  const text = tree.root
    .findAllByType(Text)
    .map((n: any) => n.props.children)
    .flat()
    .join(' ');
  expect(text).toContain('Software access');
  expect(text).toContain('1 seat');
  expect(text).toContain('Not linked to an asset');
  expect(text).not.toMatch(/Confirm Receipt|Report Issue|Licence key/);
  await act(async () => {
    tree.root
      .findAll(
        (n: any) =>
          n.props.accessibilityLabel === 'Close software details' &&
          typeof n.props.onPress === 'function'
      )[0]
      .props.onPress();
  });
  await act(async () => tree.unmount());
});
it('uses Colombo dates at midnight and distinguishes unknown expiry from a perpetual licence', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-05T19:00:00.000Z'));
  expect(softwareExpiry(seat).expired).toBe(true);
  expect(softwareExpiry({ ...seat, expiryDate: '2026-11-06' }).expired).toBe(
    false
  );
  expect(softwareExpiry({ ...seat, expiryDate: null }).label).toBe(
    'No expiry recorded'
  );
  expect(
    softwareExpiry({ ...seat, expiryDate: null, licenseType: 'Perpetual' })
      .label
  ).toBe('Perpetual licence');
  jest.useRealTimers();
});
