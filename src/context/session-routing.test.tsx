import React from 'react';
import RootLayout from '../app/_layout';
import { useAuth } from './auth-context';
import { getStoredToken, setUnauthenticatedHandler } from '../constants/api';
import { watchDeviceSession } from '../services/device-session';
const { create, act } = jest.requireActual('react-test-renderer');
let mockContext: ReturnType<typeof useAuth>;
const mockStop = jest.fn();
jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  function Stack({ children }: any) {
    return children;
  }
  Stack.Screen = function MockScreen(props: any) {
    return React.createElement('Screen', props);
  };
  Stack.Protected = function MockProtected({ guard, children }: any) {
    return guard ? children : null;
  };
  return { Stack };
});
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('../constants/api', () => ({
  getStoredToken: jest.fn(),
  clearStoredToken: jest.fn(async () => {}),
  setUnauthenticatedHandler: jest.fn(),
}));
jest.mock('../services/device-session', () => ({
  watchDeviceSession: jest.fn(() => mockStop),
}));
jest.mock('./notifications-context', () => ({
  NotificationsProvider: ({ children }: any) => {
    mockContext = jest.requireActual('./auth-context').useAuth();
    return children;
  },
}));
it('removes all protected screens on revocation and clears the notice after pairing again', async () => {
  jest
    .mocked(getStoredToken)
    .mockResolvedValue(
      `header.${btoa(JSON.stringify({ role: 'ITOperator', exp: Math.floor(Date.now() / 1000) + 86400 }))}.signature`
    );
  let tree: any;
  await act(async () => {
    tree = create(<RootLayout />);
  });
  const names = () =>
    tree.root.findAllByType('Screen').map((n: any) => n.props.name);
  expect(names()).toContain('operations/handover');
  expect(names()).toContain('asset/[assetId]');
  expect(watchDeviceSession).toHaveBeenCalledTimes(1);
  const ended = jest
    .mocked(setUnauthenticatedHandler)
    .mock.calls.find(([handler]) => handler)?.[0];
  await act(async () => {
    ended?.('unlinked');
  });
  expect(names()).toEqual(['(auth)']);
  expect(mockContext.sessionNotice).toContain('unlinked from the web');
  expect(mockStop).toHaveBeenCalledTimes(1);
  await act(async () => {
    mockContext.setIsAuthenticated(true);
  });
  expect(mockContext.sessionNotice).toBeNull();
  expect(names()).toContain('(dashboard)');
  await act(async () => tree.unmount());
});
