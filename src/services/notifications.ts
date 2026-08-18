import { fetchApi } from '../constants/api';

export interface NotificationEntry {
  id: string;
  userId: string;
  title: string;
  message: string;
  targetUrl: string | null;
  isRead: boolean;
  eventType: string;
  createdAt: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: NotificationEntry[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    returned: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

/** Fetches a page of the current user's notifications. */
export async function fetchNotifications(
  limit = 10,
  offset = 0
): Promise<NotificationsListResponse> {
  return fetchApi<NotificationsListResponse>(
    `/api/v1/notifications?limit=${limit}&offset=${offset}`
  );
}

/** Fetches the current user's unread notification count. */
export async function fetchUnreadCount(): Promise<number> {
  const result = await fetchApi<UnreadCountResponse>(
    '/api/v1/notifications/unread-count'
  );
  return result.unreadCount;
}

/** Marks one notification as read. */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  await fetchApi<unknown>(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/** Marks every notification for the current user as read. */
export async function markAllNotificationsAsRead(): Promise<void> {
  await fetchApi<unknown>('/api/v1/notifications/read-all', {
    method: 'PATCH',
  });
}
