import React from 'react';
import { AssetProfileContent } from './AssetProfileContent';
import type { AssetProfile } from '../../types/inventory';
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
const { create, act } = jest.requireActual('react-test-renderer');
jest.mock(
  'lucide-react-native',
  () =>
    new Proxy(
      {},
      {
        get: (_target, name) =>
          typeof name === 'string' ? () => null : undefined,
      }
    )
);
jest.mock('./AssetImage', () => ({ AssetImage: () => null }));
jest.mock('../ui/Button', () => ({
  Button: ({ children }: any) =>
    jest.requireActual('react').createElement('Button', null, children),
}));
const profile: AssetProfile = {
  asset: {
    id: 'asset',
    assetTag: 'SFT-001',
    name: 'Microsoft 365',
    serialNumber: null,
    status: 'available',
    condition: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-11-01',
  },
  model: {
    id: 1,
    name: 'Business Standard',
    imageUrl: null,
    brand: { id: 1, name: 'Microsoft' },
    category: { id: 1, name: 'Productivity', pillar: 'Software' },
  },
  specifications: { ram: '16 GB', touchscreen: false },
  location: null,
  owner: null,
  warrantyExpiry: null,
  assignment: null,
  softwareLicense: {
    licenseType: 'Subscription',
    totalSeats: 20,
    availableSeats: 4,
    startDate: '2026-01-01',
    expiryDate: '2027-01-01',
  },
  history: [
    {
      id: '1',
      timestamp: '1 Nov 2026',
      eventType: 'Asset Created',
      actor: 'Nimasha Perera',
      description: 'Asset registered',
    },
  ],
  maintenance: [],
};
it('shows allocated and unused software seats and supports specs and history tabs', async () => {
  let tree: any;
  await act(async () => {
    tree = create(
      <AssetProfileContent profile={profile} onIssueReported={jest.fn()} />
    );
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Unused');
  expect(JSON.stringify(tree.toJSON())).toContain('\u00b7');
  expect(JSON.stringify(tree.toJSON())).not.toContain(' ? ');
  expect(JSON.stringify(tree.toJSON())).toContain('16');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Report an issue');
  await act(async () =>
    tree.root
      .findAll(
        (node: any) =>
          node.props.accessibilityRole === 'tab' &&
          typeof node.props.onPress === 'function'
      )[1]
      .props.onPress()
  );
  expect(JSON.stringify(tree.toJSON())).toContain('16 GB');
  expect(JSON.stringify(tree.toJSON())).toContain('No');
  await act(async () =>
    tree.root
      .findAll(
        (node: any) =>
          node.props.accessibilityRole === 'tab' &&
          typeof node.props.onPress === 'function'
      )[2]
      .props.onPress()
  );
  expect(JSON.stringify(tree.toJSON())).toContain('Asset registered');
  await act(async () => tree.unmount());
});
