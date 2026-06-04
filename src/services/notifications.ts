import * as SecureStore from 'expo-secure-store';

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

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

async function getAuthToken(): Promise<string> {
  const token = await SecureStore.getItemAsync('secure_admin_api_key');
  if (!token) {
    throw new Error('Not authenticated. Please re-pair your device.');
  }
  return token;
}

function getApiUrl(): string {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }
  return API_URL;
}

/**
 * Fetches user notifications from the web API with pagination.
 */
export async function fetchNotifications(limit = 10, offset = 0): Promise<NotificationsListResponse> {
  const API_URL = getApiUrl();
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/v1/notifications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch notifications (status ${response.status})`);
  }

  return response.json();
}

/**
 * Fetches the count of unread notifications.
 */
export async function fetchUnreadCount(): Promise<number> {
  const API_URL = getApiUrl();
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch unread count (status ${response.status})`);
  }

  const result: UnreadCountResponse = await response.json();
  return result.unreadCount;
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const API_URL = getApiUrl();
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to mark notification as read (status ${response.status})`);
  }
}

/**
 * Marks all notifications for the user as read.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const API_URL = getApiUrl();
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to mark all notifications as read (status ${response.status})`);
  }
}
