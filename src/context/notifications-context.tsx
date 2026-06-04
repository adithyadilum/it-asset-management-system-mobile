import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  fetchNotifications as apiFetchNotifications,
  fetchUnreadCount as apiFetchUnreadCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  NotificationEntry
} from '../services/notifications';

type NotificationsContextType = {
  notifications: NotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadNotifications: (limit?: number, offset?: number) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('secure_admin_api_key');
      if (!token) return;
      
      const count = await apiFetchUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to load unread count:', err);
    }
  }, []);

  const loadNotifications = useCallback(async (limit = 10, offset = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync('secure_admin_api_key');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const result = await apiFetchNotifications(limit, offset);
      if (offset === 0) {
        setNotifications(result.data);
      } else {
        setNotifications((prev) => [...prev, ...result.data]);
      }
      // Sync unread count as well
      await loadUnreadCount();
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [loadUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI updates
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiMarkAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read on server:', err);
      // Re-sync with server if API call failed
      loadNotifications(10, 0);
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic UI updates
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    setUnreadCount(0);

    try {
      await apiMarkAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read on server:', err);
      // Re-sync with server if API call failed
      loadNotifications(10, 0);
    }
  }, [loadNotifications]);

  // Set up polling for the unread count
  useEffect(() => {
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        loadNotifications,
        loadUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
