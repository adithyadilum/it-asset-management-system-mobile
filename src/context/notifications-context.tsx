import { mergeNotificationPages } from '../lib/notification-pages';
import { toMessage } from '../lib/errors';
import { logger } from '../lib/logger';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { getStoredToken } from '../constants/api';
import {
  fetchNotifications as apiFetchNotifications,
  fetchUnreadCount as apiFetchUnreadCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  NotificationEntry,
} from '../services/notifications';

type NotificationsContextType = {
  notifications: NotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadNotifications: (limit?: number, offset?: number) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

/**
 * Matches the web client's floor. Push notifications (roadmap F-2) would retire
 * polling altogether; until then this is the interim interval.
 */
const POLL_INTERVAL_MS = 60_000;

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0),
    nextOffset = useRef(0),
    appendBusy = useRef(false),
    refreshBusy = useRef(false);
  const pendingReads = useRef(new Set<string>()),
    allReadBusy = useRef(false);
  const itemsRef = useRef(notifications);
  useLayoutEffect(() => {
    itemsRef.current = notifications;
  }, [notifications]);
  const prevUnreadCountRef = useRef(-1);
  const loadUnreadCount = useCallback(async () => {
    try {
      if (await getStoredToken()) setUnreadCount(await apiFetchUnreadCount());
    } catch (err) {
      logger.warn('Failed to load unread count:', err);
    }
  }, []);

  const loadNotifications = useCallback(
    async (limit = 30, offset = 0) => {
      if (offset > 0 && (appendBusy.current || refreshBusy.current)) return;
      if (offset === 0) {
        generation.current += 1;
        refreshBusy.current = true;
        appendBusy.current = false;
      } else appendBusy.current = true;
      const requestGeneration = generation.current;
      setIsLoading(true);
      setError(null);
      try {
        if (!(await getStoredToken())) return;
        const result = await apiFetchNotifications(limit, offset);
        if (requestGeneration !== generation.current) return;
        setNotifications((prev) =>
          mergeNotificationPages(offset === 0 ? [] : prev, result.data)
        );
        nextOffset.current = offset + result.pagination.returned;
        setHasMore(
          result.pagination.returned > 0 &&
            nextOffset.current < result.pagination.total
        );
        await loadUnreadCount();
      } catch (err) {
        if (requestGeneration === generation.current)
          setError(toMessage(err, 'Failed to load notifications.'));
      } finally {
        if (requestGeneration === generation.current) {
          setIsLoading(false);
          appendBusy.current = false;
          refreshBusy.current = false;
        }
      }
    },
    [loadUnreadCount]
  );
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) await loadNotifications(30, nextOffset.current);
  }, [hasMore, isLoading, loadNotifications]);

  // Update only after server acknowledgement, retaining all loaded pages on failure.
  const markAsRead = useCallback(
    async (id: string) => {
      if (
        pendingReads.current.has(id) ||
        itemsRef.current.find((n) => n.id === id)?.isRead
      )
        return;
      pendingReads.current.add(id);
      setError(null);
      try {
        await apiMarkAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        await loadUnreadCount();
      } catch (err) {
        setError(toMessage(err, 'Could not mark this alert as read.'));
      } finally {
        pendingReads.current.delete(id);
      }
    },
    [loadUnreadCount]
  );
  const markAllAsRead = useCallback(async () => {
    if (allReadBusy.current) return;
    allReadBusy.current = true;
    setError(null);
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await loadUnreadCount();
    } catch (err) {
      setError(toMessage(err, 'Could not mark alerts as read.'));
    } finally {
      allReadBusy.current = false;
    }
  }, [loadUnreadCount]);

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

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        isForeground = state === 'active';
        sync();
      }
    );

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
    if (
      unreadCount > prevUnreadCountRef.current &&
      prevUnreadCountRef.current !== -1
    ) {
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
        hasMore,
        loadMore,
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
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
}
