import React from 'react';
import {
  NotificationsProvider,
  useNotifications,
} from './notifications-context';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
} from '../services/notifications';
import type { NotificationEntry } from '../services/notifications';
const { act, create } = jest.requireActual('react-test-renderer');
jest.mock('../constants/api', () => ({
  getStoredToken: jest.fn(async () => 'paired-token'),
}));
jest.mock('../services/notifications', () => ({
  fetchNotifications: jest.fn(),
  fetchUnreadCount: jest.fn(async () => 0),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => () => {}) },
}));
const item = (id: string): NotificationEntry => ({
  id,
  isRead: false,
  userId: 'u',
  title: id,
  message: 'Alert',
  targetUrl: null,
  eventType: 'RETURN_OVERDUE',
  createdAt: '2026-11-01T00:00:00Z',
});
const page = (ids: string[], offset: number, total: number) => ({
  success: true,
  data: ids.map(item),
  pagination: { limit: 2, offset, total, returned: ids.length },
});
it('pages by server offsets, deduplicates boundaries, and preserves pages after a read failure', async () => {
  let context: ReturnType<typeof useNotifications>;
  function Consumer() {
    context = useNotifications();
    return null;
  }
  let tree: any;
  await act(async () => {
    tree = create(
      <NotificationsProvider>
        <Consumer />
      </NotificationsProvider>
    );
  });
  jest.mocked(fetchUnreadCount).mockResolvedValue(0);
  jest.mocked(fetchNotifications).mockResolvedValueOnce(page(['1', '2'], 0, 4));
  await act(async () => {
    await context!.loadNotifications(2, 0);
  });
  expect(context!.hasMore).toBe(true);
  jest.mocked(fetchNotifications).mockResolvedValueOnce(page(['2', '3'], 2, 4));
  await act(async () => {
    await context!.loadMore();
  });
  expect(fetchNotifications).toHaveBeenLastCalledWith(30, 2);
  expect(context!.notifications.map((n) => n.id)).toEqual(['1', '2', '3']);
  expect(context!.hasMore).toBe(false);
  jest
    .mocked(markNotificationAsRead)
    .mockRejectedValueOnce(new Error('Connection lost'));
  await act(async () => {
    await context!.markAsRead('3');
  });
  expect(context!.error).toContain('Connection lost');
  expect(context!.notifications).toHaveLength(3);
  expect(context!.notifications[2].isRead).toBe(false);
  jest.mocked(markNotificationAsRead).mockResolvedValueOnce();
  await act(async () => {
    await context!.markAsRead('3');
  });
  expect(context!.notifications[2].isRead).toBe(true);
  await act(async () => tree.unmount());
});
