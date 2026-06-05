import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
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

function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
      return { icon: Clock, color: Colors.warning, bg: Colors.warningLight };
    case 'RETURN_OVERDUE':
    case 'ASSET_DEFECTIVE_REPORTED':
      return { icon: AlertTriangle, color: Colors.destructive, bg: '#fee2e2' }; // Red-100
    case 'UPCOMING_RETURN':
      return { icon: Calendar, color: Colors.primary, bg: '#eff6ff' }; // Blue-50
    case 'DISPOSAL_REQUEST':
      return { icon: Trash2, color: Colors.mutedForeground, bg: Colors.muted };
    case 'DISPOSAL_APPROVED':
      return { icon: CheckCircle2, color: Colors.success, bg: '#dcfce7' }; // Green-100
    case 'DISPOSAL_REJECTED':
      return { icon: XCircle, color: Colors.destructive, bg: '#fee2e2' }; // Red-100
    case 'ROLE_CHANGE':
      return { icon: User, color: Colors.primary, bg: '#eff6ff' };
    case 'ASSIGNMENT_PENDING':
    case 'PENDING_ACCEPTANCE':
      return { icon: Layers, color: Colors.warning, bg: Colors.warningLight };
    case 'ASSIGNMENT_ACCEPTED':
      return { icon: Check, color: Colors.success, bg: '#dcfce7' };
    default:
      return { icon: Bell, color: Colors.primary, bg: Colors.warningLight };
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [activeSort, setActiveSort] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loadNotifications(30, 0);
    } catch (e) {
      console.error(e);
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

  const handleNotificationPress = async (id: string, isRead: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isRead) {
      await markAsRead(id);
    }
  };

  // Perform local sorting
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (activeSort === 'date-desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (activeSort === 'date-asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (activeSort === 'name-asc') {
      return a.title.localeCompare(b.title);
    }
    if (activeSort === 'name-desc') {
      return b.title.localeCompare(a.title);
    }
    return 0;
  });

  const renderItem = ({ item, index }: { item: typeof notifications[0]; index: number }) => {
    const config = getEventTypeConfig(item.eventType);
    const IconComponent = config.icon;

    return (
      <Animated.View
        layout={Layout.springify()}
        entering={FadeInDown.delay(index * 20).duration(350)}
        style={styles.cardWrapper}
      >
        <View
          style={[
            styles.card,
            !item.isRead ? styles.cardUnread : styles.cardRead,
          ]}
        >
          <Pressable
            onPress={() => handleNotificationPress(item.id, item.isRead)}
            style={styles.cardContent}
          >
            {/* Left status bar accent */}
            {!item.isRead && <View style={styles.unreadIndicatorBar} />}

            {/* Event Type Icon */}
            <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
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
                <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
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
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Top Banner Header */}
      <View style={styles.header}>
        <View>
          <Text className="text-2xl font-sansBold text-foreground">Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread notifications</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
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
                pressed && { opacity: 0.6 }
              ]}
              accessibilityLabel="Sort notifications"
            >
              <ArrowUpDown size={20} color={sortVisible ? Colors.primary : Colors.foreground} />
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
            <Text style={[styles.sortOptionText, activeSort === 'date-desc' && styles.sortOptionTextActive]}>
              Newest First (Date)
            </Text>
            {activeSort === 'date-desc' && <Check size={14} color={Colors.primary} />}
          </Pressable>

          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('date-asc');
              setSortVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, activeSort === 'date-asc' && styles.sortOptionTextActive]}>
              Oldest First (Date)
            </Text>
            {activeSort === 'date-asc' && <Check size={14} color={Colors.primary} />}
          </Pressable>

          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('name-asc');
              setSortVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, activeSort === 'name-asc' && styles.sortOptionTextActive]}>
              Alphabetical (A to Z)
            </Text>
            {activeSort === 'name-asc' && <Check size={14} color={Colors.primary} />}
          </Pressable>

          <Pressable
            style={styles.sortOptionRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSort('name-desc');
              setSortVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, activeSort === 'name-desc' && styles.sortOptionTextActive]}>
              Alphabetical (Z to A)
            </Text>
            {activeSort === 'name-desc' && <Check size={14} color={Colors.primary} />}
          </Pressable>
        </Animated.View>
      )}

      {/* Main Content List */}
      {isLoading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          contentContainerStyle={styles.emptyContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Bell size={32} color={Colors.tabInactive} strokeWidth={1.5} />
              </View>
              <Text className="text-lg font-sansBold text-foreground mt-4">All quiet for now</Text>
              <Text className="text-sm font-sans text-muted-foreground text-center mt-1 px-8">
                You're completely up to date! Updates on asset approvals or system alerts will appear here.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={sortedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
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
    shadowOffset: { width: 0, height: 1 },
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
