import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { getApiUrl } from '../../constants/api';
import { notificationDestination } from '../../lib/notification-navigation';
import { StateMessage } from '../../components/ui/StateMessage';
import { logger } from '../../lib/logger';
import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import type { NotificationEntry } from '../../services/notifications';
import {
  Alert,
  AppState,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Bell,
  ArrowUpDown,
  CheckCheck,
  Clock,
  AlertTriangle,
  Calendar,
  Trash2,
  CheckCircle2,
  XCircle,
  User,
  Check,
  Layers,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '../../context/notifications-context';
import { Colors } from '../../constants/colors';
function formatTimeAgo(dateString: string, now: number) {
  try {
    const date = new Date(dateString);
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
interface EventTypeConfig {
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
}
const getEventTypeConfig = (eventType: string): EventTypeConfig => {
  switch (eventType) {
    case 'WARRANTY_EXPIRY':
    case 'SOFTWARE_LICENSE_RENEWAL':
      return {
        icon: Clock,
        color: Colors.warning,
        bg: Colors.warningLight,
      };
    case 'RETURN_OVERDUE':
    case 'ASSET_DEFECTIVE_REPORTED':
      return {
        icon: AlertTriangle,
        color: Colors.destructive,
        bg: '#fee2e2',
      };
    // Red-100
    case 'UPCOMING_RETURN':
      return {
        icon: Calendar,
        color: Colors.primary,
        bg: '#eff6ff',
      };
    // Blue-50
    case 'DISPOSAL_REQUEST':
      return {
        icon: Trash2,
        color: Colors.mutedForeground,
        bg: Colors.muted,
      };
    case 'DISPOSAL_APPROVED':
      return {
        icon: CheckCircle2,
        color: Colors.success,
        bg: '#dcfce7',
      };
    // Green-100
    case 'DISPOSAL_REJECTED':
      return {
        icon: XCircle,
        color: Colors.destructive,
        bg: '#fee2e2',
      };
    // Red-100
    case 'ROLE_CHANGE':
      return {
        icon: User,
        color: Colors.primary,
        bg: '#eff6ff',
      };
    case 'ASSIGNMENT_PENDING':
    case 'PENDING_ACCEPTANCE':
      return {
        icon: Layers,
        color: Colors.warning,
        bg: Colors.warningLight,
      };
    case 'ASSIGNMENT_ACCEPTED':
      return {
        icon: Check,
        color: Colors.success,
        bg: '#dcfce7',
      };
    default:
      return {
        icon: Bell,
        color: Colors.primary,
        bg: Colors.warningLight,
      };
  }
};
const notificationKey = (item: NotificationEntry) => item.id;
const NotificationRow = memo(function NotificationRow({
  item,
  onPress,
  nowMinute,
}: {
  item: NotificationEntry;
  onPress: (
    id: string,
    isRead: boolean,
    targetUrl: string | null
  ) => Promise<void>;
  nowMinute: number;
}) {
  const config = getEventTypeConfig(item.eventType);
  const IconComponent = config.icon;
  return (
    <View style={styles.cardWrapper}>
      <View
        style={[
          styles.card,
          !item.isRead ? styles.cardUnread : styles.cardRead,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.isRead ? 'Read' : 'Unread'} alert: ${item.title}`}
          onPress={() => onPress(item.id, item.isRead, item.targetUrl)}
          style={styles.cardContent}
        >
          {/* Left status bar accent */}
          {!item.isRead && <View style={styles.unreadIndicatorBar} />}

          {/* Event Type Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: config.bg,
              },
            ]}
          >
            <IconComponent size={18} color={config.color} strokeWidth={2} />
          </View>

          {/* Text block */}
          <View style={styles.textContainer}>
            <View style={styles.cardHeaderRow}>
              <Text
                style={[
                  styles.cardTitle,
                  !item.isRead ? styles.textUnread : styles.textRead,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.timeText}>
                {formatTimeAgo(item.createdAt, nowMinute * 60_000)}
              </Text>
            </View>
            <Text
              style={[
                styles.cardMessage,
                !item.isRead ? styles.messageUnread : styles.messageRead,
              ]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    loadMore,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [activeSort, setActiveSort] = useState<
    'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'
  >('date-desc');
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loadNotifications(30, 0);
    } catch (e) {
      logger.error('Failed to load notifications:', e);
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);
  useEffect(() => {
    loadNotifications(30, 0);
  }, [loadNotifications]);
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markAllAsRead();
  };
  const handleNotificationPress = useCallback(
    async (id: string, isRead: boolean, targetUrl: string | null) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!isRead) {
        await markAsRead(id);
      }
      const destination = notificationDestination(getApiUrl(), targetUrl);
      if (destination?.kind === 'native') router.push(destination.path);
      else if (destination?.kind === 'web') {
        try {
          await Linking.openURL(destination.url);
        } catch {
          Alert.alert(
            'Unable to open alert',
            'Try opening this alert from the desktop.'
          );
        }
      }
    },
    [markAsRead, router]
  );

  // Perform local sorting
  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (activeSort === 'date-desc') {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if (activeSort === 'date-asc') {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (activeSort === 'name-asc') {
          return a.title.localeCompare(b.title);
        }
        if (activeSort === 'name-desc') {
          return b.title.localeCompare(a.title);
        }
        return 0;
      }),
    [notifications, activeSort]
  );
  const [nowMinute, setNowMinute] = useState(() =>
    Math.floor(Date.now() / 60_000)
  );
  // One clock for visible alert ages; pause it off-tab and in the background.
  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setInterval> | undefined;
      const update = () => setNowMinute(Math.floor(Date.now() / 60_000));
      const sync = (state: string) => {
        if (state === 'active') {
          update();
          timer ??= setInterval(update, 60_000);
        } else {
          clearInterval(timer);
          timer = undefined;
        }
      };
      const subscription = AppState.addEventListener('change', sync);
      sync(AppState.currentState);
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [])
  );
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<NotificationEntry>) => (
      <NotificationRow
        item={item}
        onPress={handleNotificationPress}
        nowMinute={nowMinute}
      />
    ),
    [handleNotificationPress, nowMinute]
  );

  return (
    <View
      style={[
        nativeStyles.panel,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Top Banner Header */}
      <View style={styles.header}>
        <View>
          <Text style={nativeStyles.title}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread notifications
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && {
                  opacity: 0.6,
                },
              ]}
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={20} color={Colors.primary} />
            </Pressable>
          )}

          {notifications.length > 0 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSortVisible(!sortVisible);
              }}
              style={({ pressed }) => [
                styles.headerButton,
                sortVisible && styles.headerButtonActive,
                pressed && {
                  opacity: 0.6,
                },
              ]}
              accessibilityLabel="Sort notifications"
            >
              <ArrowUpDown
                size={20}
                color={sortVisible ? Colors.primary : Colors.foreground}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sorting Options Dropdown Panel */}
      {sortVisible && notifications.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          style={styles.sortDropdown}
        >
          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('date-desc');
              setSortVisible(false);
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                activeSort === 'date-desc' && styles.sortOptionTextActive,
              ]}
            >
              Newest First (Date)
            </Text>
            {activeSort === 'date-desc' && (
              <Check size={14} color={Colors.primary} />
            )}
          </Pressable>

          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('date-asc');
              setSortVisible(false);
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                activeSort === 'date-asc' && styles.sortOptionTextActive,
              ]}
            >
              Oldest First (Date)
            </Text>
            {activeSort === 'date-asc' && (
              <Check size={14} color={Colors.primary} />
            )}
          </Pressable>

          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('name-asc');
              setSortVisible(false);
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                activeSort === 'name-asc' && styles.sortOptionTextActive,
              ]}
            >
              Alphabetical (A to Z)
            </Text>
            {activeSort === 'name-asc' && (
              <Check size={14} color={Colors.primary} />
            )}
          </Pressable>

          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('name-desc');
              setSortVisible(false);
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                activeSort === 'name-desc' && styles.sortOptionTextActive,
              ]}
            >
              Alphabetical (Z to A)
            </Text>
            {activeSort === 'name-desc' && (
              <Check size={14} color={Colors.primary} />
            )}
          </Pressable>
        </Animated.View>
      )}

      {error ? (
        <StateMessage
          type="error"
          message={error}
          onRetry={() => void loadNotifications(30, 0)}
        />
      ) : null}
      {activeSort !== 'date-desc' && hasMore ? (
        <Text
          style={{
            paddingHorizontal: 20,
            color: Colors.mutedForeground,
          }}
        >
          Sorting loaded alerts. Load older alerts to include them.
        </Text>
      ) : null}
      {/* Main Content List */}
      {isLoading && notifications.length === 0 ? (
        <View style={nativeStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.emptyContainer}
          ListEmptyComponent={
            error ? null : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Bell
                    size={32}
                    color={Colors.tabInactive}
                    strokeWidth={1.5}
                  />
                </View>
                <Text style={nativeStyles.title2}>All quiet for now</Text>
                <Text style={nativeStyles.text}>
                  You&apos;re completely up to date! Updates on asset approvals
                  or system alerts will appear here.
                </Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          onEndReached={() => {
            if (!error) void loadMore();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : hasMore ? (
              <Pressable
                onPress={() => void loadMore()}
                style={{
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: Colors.primary,
                  }}
                >
                  Load older alerts
                </Text>
              </Pressable>
            ) : null
          }
          data={sortedNotifications}
          keyExtractor={notificationKey}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          windowSize={7}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.primary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.muted,
  },
  headerButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  sortDropdown: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border + '50',
  },
  sortOptionText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  sortOptionTextActive: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary + '25',
  },
  cardRead: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    opacity: 0.85,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  unreadIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  textUnread: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  textRead: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    opacity: 0.8,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  cardMessage: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  messageUnread: {
    fontFamily: 'NotoSans_400Regular',
    color: Colors.foreground,
  },
  messageRead: {
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
const nativeStyles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#0F172A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title2: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#0F172A',
    marginTop: 16,
  },
  text: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
