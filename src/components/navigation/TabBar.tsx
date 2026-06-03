import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Home, Package, Bell } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/colors';

type TabIconProps = {
  routeName: string;
  isFocused: boolean;
};

function TabIcon({ routeName, isFocused }: TabIconProps) {
  const color = isFocused ? Colors.tabActive : Colors.tabInactive;
  const size = 22;
  const strokeWidth = isFocused ? 2.25 : 1.75;

  switch (routeName) {
    case 'index':
      return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    case 'my-assets':
      return <Package size={size} color={color} strokeWidth={strokeWidth} />;
    case 'notifications':
      return <Bell size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return null;
  }
}

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  'my-assets': 'My Assets',
  notifications: 'Alerts',
};

/**
 * Custom bottom tab bar with:
 * - Clean white background + subtle top border
 * - Active tab: navy Lucide icon + label (bolder stroke)
 * - Inactive tab: muted gray Lucide icon + text
 * - Red notification dot on bell icon
 * - SafeAreaView bottom padding for notched devices (iOS & Android)
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
      className="bg-card border-t border-border"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const routeName = route.name;

        // Skip scanner route from tab bar
        if (routeName === 'scanner') return null;

        const label = TAB_LABELS[routeName] || routeName;

        const onPress = async () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View style={styles.iconContainer}>
              <TabIcon routeName={routeName} isFocused={isFocused} />
              {/* Notification badge dot */}
              {routeName === 'notifications' && (
                <View style={styles.badgeDot} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isFocused ? Colors.tabActive : Colors.tabInactive,
                  fontFamily: isFocused ? 'NotoSans_700Bold' : 'NotoSans_400Regular',
                },
              ]}
            >
              {label}
            </Text>
            {/* Active indicator bar */}
            {isFocused && <View style={styles.activeIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.notificationBadge,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
  },
});
