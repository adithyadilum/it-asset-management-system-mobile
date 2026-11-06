import React from 'react';
import { Alert, Modal, Text } from 'react-native';
import { Header } from './Header';
import { fetchUserProfile, unlinkMe } from '../../services/auth';
import { getStoredToken } from '../../constants/api';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
const { create, act } = jest.requireActual('react-test-renderer');
const mockPush = jest.fn();
const mockSignOut = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16 }),
}));
jest.mock('@react-native-community/netinfo', () => ({ useNetInfo: jest.fn() }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.0' } },
}));
jest.mock('expo-device', () => ({
  modelName: 'Galaxy S24',
  osName: 'Android',
  osVersion: '14',
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));
jest.mock(
  'lucide-react-native',
  () => new Proxy({}, { get: () => () => null })
);
jest.mock('../../context/auth-context', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));
jest.mock('../../services/auth', () => ({
  fetchUserProfile: jest.fn(),
  unlinkMe: jest.fn(),
}));
jest.mock('../../constants/api', () => ({
  getStoredToken: jest.fn(),
  getApiUrl: () => 'https://tiqri-assets.vercel.app',
}));

const profile = {
  id: 'user-1',
  name: 'Amaya Perera',
  email: 'amaya.perera@example.com',
  role: 'ITOperator',
  initials: 'AP',
};
let tree: any;
const press = (label: string) =>
  tree.root
    .findAll(
      (node: any) =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function'
    )[0]
    .props.onPress();
const text = () =>
  tree.root
    .findAllByType(Text)
    .map((node: any) => node.props.children)
    .flat()
    .join(' ');
async function openAccount() {
  await act(async () => {
    tree = create(<Header />);
  });
  await act(async () => press('Open account menu'));
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchUserProfile).mockResolvedValue(profile);
  jest.mocked(getStoredToken).mockResolvedValue('private-device-token');
  jest.mocked(Haptics.impactAsync).mockResolvedValue();
  jest.mocked(unlinkMe).mockResolvedValue();
  mockSignOut.mockResolvedValue(undefined);
  jest.mocked(useNetInfo).mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  } as any);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
});

it('shows real account and device details and closes the sheet before opening My assets', async () => {
  await openAccount();
  expect(text()).toContain('Amaya Perera');
  expect(text()).toContain('amaya.perera@example.com');
  expect(text()).toContain('IT operator');
  expect(text()).toContain('Galaxy S24');
  expect(text()).toContain('Android 14');
  expect(text()).toContain('tiqri-assets.vercel.app');
  expect(text()).not.toContain('private-device-token');
  expect(getStoredToken).not.toHaveBeenCalled();
  await act(async () => press('Open My assets'));
  expect(mockPush).toHaveBeenCalledWith('/(dashboard)/my-assets');
  expect(tree.root.findByType(Modal).props.visible).toBe(false);
});
it('distinguishes offline status from the saved device pairing', async () => {
  jest.mocked(useNetInfo).mockReturnValue({
    isConnected: false,
    isInternetReachable: false,
    type: 'none',
  } as any);
  await openAccount();
  expect(text()).toContain('Offline');
  expect(text()).toContain('Paired');
  expect(text()).toContain('Pairing is saved.');
  expect(text()).not.toContain('Wi-Fi connected');
});
it('lets a failed profile fetch recover through retry', async () => {
  const warning = jest
    .spyOn(console, 'warn')
    .mockImplementation(() => undefined);
  jest
    .mocked(fetchUserProfile)
    .mockRejectedValueOnce(new Error('Network request failed'));
  await openAccount();
  expect(text()).toContain('Account details could not be loaded.');
  await act(async () => press('Retry loading account'));
  expect(fetchUserProfile).toHaveBeenCalledTimes(2);
  expect(text()).toContain('Amaya Perera');
  expect(text()).not.toContain('Account details could not be loaded.');
  warning.mockRestore();
});
it('requires explicit unlink confirmation and signs out even if haptics and token storage fail', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await openAccount();
  await act(async () => press('Unlink this device'));
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(unlinkMe).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2]!;
  expect(buttons.find((button) => button.style === 'cancel')?.text).toBe(
    'Keep linked'
  );
  jest
    .mocked(getStoredToken)
    .mockRejectedValueOnce(new Error('Storage unavailable'));
  jest
    .mocked(Haptics.impactAsync)
    .mockRejectedValueOnce(new Error('No haptics'));
  await act(async () => {
    await buttons.find((button) => button.style === 'destructive')?.onPress?.();
  });
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(unlinkMe).not.toHaveBeenCalled();
});
it('revokes the original pairing after signing out locally', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await openAccount();
  await act(async () => press('Unlink this device'));
  await act(async () => {
    await alert.mock.calls[0]
      [2]!.find((button) => button.style === 'destructive')
      ?.onPress?.();
  });
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(unlinkMe).toHaveBeenCalledWith('private-device-token');
});
