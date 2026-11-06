import React from 'react';
import { Alert } from 'react-native';
import { HandoverForm } from './HandoverForm';
import { ReturnForm } from './ReturnForm';
import {
  createHandover,
  searchRecipients,
  assignmentAction,
  inspectReturn,
} from '../../services/operations';
import type { AssetProfile } from '../../types/inventory';
const { create, act } = jest.requireActual('react-test-renderer');
jest.mock('../../services/operations', () => ({
  createHandover: jest.fn(),
  searchRecipients: jest.fn(),
  assignmentAction: jest.fn(),
  inspectReturn: jest.fn(),
}));
jest.mock('../ui/Button', () => ({
  Button: ({ children, ...props }: any) =>
    jest.requireActual('react').createElement('Button', props, children),
}));
jest.mock('./OperationLayout', () => ({
  operationStyles: {},
  Field: (props: any) =>
    jest.requireActual('react').createElement('Field', props),
  Choice: (props: any) =>
    jest.requireActual('react').createElement('Choice', props),
  OperationSuccess: (props: any) =>
    jest.requireActual('react').createElement('Success', props),
}));
const profile: AssetProfile = {
  asset: {
    id: 'asset-1',
    assetTag: 'LAP-108',
    name: 'Engineering laptop',
    serialNumber: 'SN108',
    status: 'Available',
    condition: 'Excellent',
    createdAt: '2026-01-01',
    updatedAt: '2026-11-06T04:00:00.000Z',
  },
  model: {
    id: 1,
    name: 'Latitude 5440',
    imageUrl: null,
    brand: { id: 1, name: 'Dell' },
    category: { id: 1, name: 'Laptop', pillar: 'Hardware' },
  },
  specifications: { ram: '16 GB' },
  location: null,
  owner: null,
  warrantyExpiry: null,
  assignment: null,
  softwareLicense: null,
  history: [],
  maintenance: [],
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (v: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const button = (tree: any, label: string) =>
  tree.root
    .findAllByType('Button')
    .find((node: any) => node.props.children === label);
const click = (tree: any, label: string) =>
  tree.root
    .findAll(
      (node: any) =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function'
    )[0]
    .props.onPress();
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.useRealTimers());
it('searches recipients, preserves handover inputs after failure and blocks duplicate writes', async () => {
  jest.useFakeTimers();
  jest
    .mocked(searchRecipients)
    .mockResolvedValue({
      data: [
        {
          id: 'employee-1',
          name: 'Kasun Fernando',
          detail: 'kasun@tiqri.test',
        },
      ],
      hasMore: false,
    });
  const pending = deferred<any>();
  jest.mocked(createHandover).mockReturnValueOnce(pending.promise);
  let tree: any;
  await act(async () => {
    tree = create(
      <HandoverForm
        profile={profile}
        onBusyChange={jest.fn()}
        onRefresh={jest.fn()}
      />
    );
  });
  await act(async () =>
    tree.root
      .findAllByType('Field')
      .find((node: any) => node.props.label === 'Search employees')
      .props.onChangeText('Kasun')
  );
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(searchRecipients).toHaveBeenCalledWith('user', 'Kasun');
  await act(async () => click(tree, 'Select Kasun Fernando'));
  await act(async () =>
    tree.root
      .findAllByType('Field')
      .find((node: any) => node.props.label === 'Handover notes (optional)')
      .props.onChangeText(' Charger included ')
  );
  const submit = button(tree, 'Create handover').props.onPress;
  await act(async () => {
    submit();
    submit();
  });
  expect(createHandover).toHaveBeenCalledTimes(1);
  expect(createHandover).toHaveBeenCalledWith(
    expect.objectContaining({
      assetId: 'asset-1',
      expectedUpdatedAt: profile.asset.updatedAt,
      targetId: 'employee-1',
      assignmentType: 'user',
      notes: 'Charger included',
    })
  );
  await act(async () =>
    pending.reject(new Error('Asset changed. Refresh it.'))
  );
  expect(
    tree.root.findAllByProps({ children: 'Kasun Fernando' }).length
  ).toBeGreaterThan(0);
  expect(
    tree.root.findByProps({ accessibilityRole: 'alert' }).props.children
  ).toContain('Refresh');
  jest
    .mocked(createHandover)
    .mockResolvedValueOnce({
      success: true,
      message: 'Employee acceptance pending.',
    });
  await act(async () => button(tree, 'Create handover').props.onPress());
  expect(tree.root.findByType('Success').props.message).toBe(
    'Employee acceptance pending.'
  );
  await act(async () => tree.unmount());
});
it('blocks return receipt for unaccepted employee handovers', async () => {
  let tree: any;
  await act(async () => {
    tree = create(
      <ReturnForm
        profile={{
          ...profile,
          asset: { ...profile.asset, status: 'Assigned' },
          assignment: {
            id: 4,
            assignedToUser: {
              id: 'person',
              name: 'Kasun',
              email: 'kasun@tiqri.test',
            },
            assignedToLocation: null,
            assignedDate: '2026-11-01',
            expectedReturnDate: null,
            state: 'pending approval',
          },
        }}
        onBusyChange={jest.fn()}
        onRefresh={jest.fn()}
      />
    );
  });
  expect(button(tree, 'Receive asset')).toBeUndefined();
  expect(assignmentAction).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});
it('records receipt once and does not replay it when the profile refresh fails', async () => {
  const pending = deferred<any>();
  jest.mocked(assignmentAction).mockReturnValueOnce(pending.promise);
  const received = {
    ...profile,
    asset: { ...profile.asset, status: 'Assigned' },
    assignment: {
      id: 4,
      assignedToUser: {
        id: 'person',
        name: 'Kasun',
        email: 'kasun@tiqri.test',
      },
      assignedToLocation: null,
      assignedDate: '2026-11-01',
      expectedReturnDate: null,
      state: 'assigned',
    },
  };
  let tree: any;
  await act(async () => {
    tree = create(
      <ReturnForm
        profile={received}
        onBusyChange={jest.fn()}
        onRefresh={jest.fn().mockRejectedValue(new Error('Cannot refresh'))}
      />
    );
  });
  await act(async () => button(tree, 'Receive asset').props.onPress());
  const confirm = (jest.mocked(Alert.alert).mock.calls[0][2] ?? []).find(
    (option) => option.text === 'Receive asset'
  )!.onPress!;
  await act(async () => {
    confirm();
    confirm();
  });
  expect(assignmentAction).toHaveBeenCalledTimes(1);
  await act(async () =>
    pending.resolve({ success: true, message: 'Received' })
  );
  expect(button(tree, 'Receive asset')).toBeUndefined();
  expect(button(tree, 'Continue to inspection')).toBeDefined();
  await act(async () => tree.unmount());
});
it('requires both inspection conditions and preserves the selected outcome across retry', async () => {
  jest
    .mocked(inspectReturn)
    .mockRejectedValueOnce(new Error('Service unavailable'))
    .mockResolvedValueOnce({ success: true, message: 'Recorded' });
  let tree: any;
  await act(async () => {
    tree = create(
      <ReturnForm
        profile={{
          ...profile,
          asset: { ...profile.asset, status: 'Returned' },
        }}
        onBusyChange={jest.fn()}
        onRefresh={jest.fn()}
      />
    );
  });
  expect(button(tree, 'Confirm inspection').props.disabled).toBe(true);
  await act(async () => {
    tree.root
      .findAllByType('Choice')
      .find((node: any) => node.props.label === 'Needs Repair')
      .props.onPress();
    tree.root
      .findAllByType('Choice')
      .find((node: any) => node.props.label === 'Damaged')
      .props.onPress();
  });
  await act(async () => button(tree, 'Confirm inspection').props.onPress());
  expect(
    tree.root.findByProps({ accessibilityRole: 'alert' }).props.children
  ).toBe('Service unavailable');
  expect(
    tree.root
      .findAllByType('Choice')
      .find((node: any) => node.props.label === 'Damaged').props.selected
  ).toBe(true);
  await act(async () => button(tree, 'Confirm inspection').props.onPress());
  expect(inspectReturn).toHaveBeenLastCalledWith(
    expect.objectContaining({
      condition: 'Needs Repair',
      physicalCondition: 'Damaged',
      expectedUpdatedAt: profile.asset.updatedAt,
    })
  );
  expect(tree.root.findByType('Success').props.message).toContain('In Repair');
  await act(async () => tree.unmount());
});
