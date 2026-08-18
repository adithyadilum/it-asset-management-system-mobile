import { toMessage } from '../lib/errors';
import { logger } from '../lib/logger';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { getStoredToken } from '../constants/api';
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

/**
 * Matches the web client's floor. Push notifications (roadmap F-2) would retire
 * polling altogether; until then this is the interim interval.
 */
const POLL_INTERVAL_MS = 60_000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevUnreadCountRef = useRef(-1);

  const loadUnreadCount = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const count = await apiFetchUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      logger.warn('Failed to load unread count:', err);
    }
  }, []);

  const loadNotifications = useCallback(async (limit = 10, offset = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getStoredToken();
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
    } catch (err) {
      setError(toMessage(err, 'Failed to load notifications'));
      logger.error('Failed to load notifications:', err);
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
      logger.error('Failed to mark notification as read on server:', err);
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
      logger.error('Failed to mark all notifications as read on server:', err);
      // Re-sync with server if API call failed
      loadNotifications(10, 0);
    }
  }, [loadNotifications]);

  // Poll for the unread count, but only while the app is in the foreground and
  // connected. The previous unconditional 30s interval kept the radio awake for
  // as long as the app was resident — including in the background, where the
  // result could not be seen (M-07).
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let isForeground = AppState.currentState === 'active';
    let isConnected = true;

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const sync = () => {
      if (isForeground && isConnected) {
        if (interval) return;
        loadUnreadCount();
        interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
      } else {
        stop();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      isForeground = state === 'active';
      sync();
    });

    const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      isConnected = state.isConnected !== false;
      sync();
    });

    sync();

    return () => {
      stop();
      appStateSubscription.remove();
      netInfoUnsubscribe();
    };
  }, [loadUnreadCount]);

  // Automatically fetch notifications if unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== -1) {
      loadNotifications(30, 0);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, loadNotifications]);

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

