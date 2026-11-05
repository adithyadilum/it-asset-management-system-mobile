import type { NotificationEntry } from '../services/notifications';
export function mergeNotificationPages(
  previous: NotificationEntry[],
  incoming: NotificationEntry[]
) {
  const items = new Map(previous.map((item) => [item.id, item]));
  for (const item of incoming) items.set(item.id, item);
  return [...items.values()];
}
