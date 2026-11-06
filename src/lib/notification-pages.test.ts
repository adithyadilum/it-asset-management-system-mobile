import { mergeNotificationPages } from './notification-pages';
import type { NotificationEntry } from '../services/notifications';
const item = (id: string, isRead = false): NotificationEntry => ({
  id,
  isRead,
  userId: 'u',
  title: id,
  message: 'Message',
  targetUrl: null,
  eventType: 'RETURN_OVERDUE',
  createdAt: '2026-11-01T00:00:00Z',
});
it('deduplicates shifting page boundaries and keeps the latest read state', () => {
  const result = mergeNotificationPages(
    [item('1'), item('2')],
    [item('2', true), item('3')]
  );
  expect(result.map((n) => n.id)).toEqual(['1', '2', '3']);
  expect(result[1].isRead).toBe(true);
});

it('preserves unchanged row identities and applies changed message and navigation details', () => {
  const first = item('1'),
    second = item('2');
  const changed = {
    ...second,
    message: 'Return received',
    targetUrl: '/my-assets',
  };
  const result = mergeNotificationPages(
    [first, second],
    [{ ...first }, changed]
  );
  expect(result[0]).toBe(first);
  expect(result[1]).toBe(changed);
});
it('refreshes the first page without retaining stale pages or rebuilding unchanged rows', () => {
  const first = item('1'),
    oldPage = item('2');
  const result = mergeNotificationPages([first, oldPage], [{ ...first }], true);
  expect(result).toEqual([first]);
  expect(result[0]).toBe(first);
});
