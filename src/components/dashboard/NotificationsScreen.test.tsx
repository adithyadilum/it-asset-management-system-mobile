import React from 'react';
import { AppState, Text } from 'react-native';
import NotificationsScreen from '../../app/(dashboard)/notifications';
import { useNotifications } from '../../context/notifications-context';
import type { NotificationEntry } from '../../services/notifications';
const { create, act } = jest.requireActual('react-test-renderer');
const mockPush = jest.fn();
const mockRouter = { push: mockPush };
const mockClockRender = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (callback: () => void) =>
    jest.requireActual('react').useEffect(callback, [callback]),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('../../context/notifications-context', () => ({
  useNotifications: jest.fn(),
}));
jest.mock('../../constants/api', () => ({
  getApiUrl: () => 'https://tiqri-assets.vercel.app',
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
jest.mock(
  'lucide-react-native',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => () => {
          if (name === 'Clock') mockClockRender();
          return null;
        },
      }
    )
);
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: jest.requireActual('react-native').View },
  FadeInUp: { duration: () => undefined },
}));
const notification = (id: string): NotificationEntry => ({
  id,
  userId: 'u',
  title: `Warranty due: LAP-${id}`,
  message: 'Review the laptop warranty.',
  eventType: 'WARRANTY_EXPIRY',
  createdAt: '2026-11-06T04:29:00.000Z',
  isRead: false,
  targetUrl: '/my-assets',
});
let tree: any;
const press = (label: string) =>
  tree.root
    .findAll(
      (node: any) =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function'
    )[0]
    .props.onPress();
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .spyOn(Date, 'now')
    .mockReturnValue(new Date('2026-11-06T04:30:00.000Z').getTime());
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.useRealTimers();
  jest.restoreAllMocks();
});
it('does not redraw alert rows when sorting controls open and redraws only the changed read state', async () => {
  const notifications = [
    notification('101'),
    notification('102'),
    notification('103'),
  ];
  const state = {
    notifications,
    unreadCount: 3,
    isLoading: false,
    error: null,
    hasMore: true,
    loadMore: jest.fn(async () => {}),
    loadNotifications: jest.fn(async () => {}),
    loadUnreadCount: jest.fn(async () => {}),
    markAsRead: jest.fn(async () => {}),
    markAllAsRead: jest.fn(async () => {}),
  };
  jest.mocked(useNotifications).mockReturnValue(state);
  await act(async () => {
    tree = create(<NotificationsScreen />);
  });
  expect(mockClockRender).toHaveBeenCalledTimes(3);
  await act(async () => press('Sort notifications'));
  expect(mockClockRender).toHaveBeenCalledTimes(3);
  jest.mocked(useNotifications).mockReturnValue({
    ...state,
    notifications: [
      notifications[0],
      { ...notifications[1], isRead: true },
      notifications[2],
    ],
    unreadCount: 2,
  });
  await act(async () => tree.update(<NotificationsScreen />));
  expect(mockClockRender).toHaveBeenCalledTimes(4);
  expect(
    tree.root.findAllByProps({
      accessibilityLabel: 'Read alert: Warranty due: LAP-102',
    }).length
  ).toBeGreaterThan(0);
  await act(async () => press('Unread alert: Warranty due: LAP-101'));
  expect(state.markAsRead).toHaveBeenCalledWith('101');
  expect(mockPush).toHaveBeenCalledWith('/(dashboard)/my-assets');
});

it('updates relative ages while visible and pauses row updates in the background', async () => {
  jest.useFakeTimers({ doNotFake: ['Date'] });
  let now = new Date('2026-11-06T04:30:00.000Z').getTime();
  jest.mocked(Date.now).mockImplementation(() => now);
  const subscriptions = jest.spyOn(AppState, 'addEventListener');
  jest.mocked(useNotifications).mockReturnValue({
    notifications: [notification('101')],
    unreadCount: 1,
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: jest.fn(async () => {}),
    loadNotifications: jest.fn(async () => {}),
    loadUnreadCount: jest.fn(async () => {}),
    markAsRead: jest.fn(async () => {}),
    markAllAsRead: jest.fn(async () => {}),
  });
  await act(async () => {
    tree = create(<NotificationsScreen />);
  });
  const changeState = subscriptions.mock.calls.find(
    ([event]) => event === 'change'
  )![1];
  const text = () =>
    tree.root
      .findAllByType(Text)
      .map((node: any) => node.props.children)
      .flat()
      .join(' ');
  await act(async () => changeState('active'));
  expect(text()).toContain('1m ago');
  await act(async () => {
    now += 60_000;
    jest.advanceTimersByTime(60_000);
  });
  expect(text()).toContain('2m ago');
  await act(async () => changeState('background'));
  const draws = mockClockRender.mock.calls.length;
  await act(async () => {
    now += 120_000;
    jest.advanceTimersByTime(120_000);
  });
  expect(mockClockRender).toHaveBeenCalledTimes(draws);
  await act(async () => changeState('active'));
  expect(text()).toContain('4m ago');
});
