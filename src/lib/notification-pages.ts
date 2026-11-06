import type { NotificationEntry } from '../services/notifications';

/** Merge pages, preserving unchanged records so existing rows can skip rendering. */
export function mergeNotificationPages(
  previous: NotificationEntry[],
  incoming: NotificationEntry[],
  replace = false
) {
  const existing = new Map(previous.map((item) => [item.id, item]));
  const items = replace
    ? new Map<string, NotificationEntry>()
    : new Map(existing);
  for (const item of incoming) {
    const old = existing.get(item.id);
    const keys = Object.keys(item) as (keyof NotificationEntry)[];
    const unchanged =
      old &&
      Object.keys(old).length === keys.length &&
      keys.every((key) => Object.is(old[key], item[key]));
    items.set(item.id, unchanged ? old : item);
  }
  return [...items.values()];
}
