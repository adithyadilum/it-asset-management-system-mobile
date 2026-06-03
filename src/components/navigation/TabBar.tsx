import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
  const color = isFocused ? Colors.primary : Colors.tabInactive;
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
 * Minimal tab bar — no shadow, no border. Just a hairline separator and brand-colored
 * active state with a small indicator pill above the icon.
 * SafeAreaView aware for iOS notch and Android nav bar.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Hairline separator — not a harsh border */}
      <View style={styles.separator} />

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const routeName = route.name;

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
            navigation.emit({ type: 'tabLongPress', target: route.key });
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
              {/* Active pill indicator above icon */}
              <View style={[styles.pill, isFocused ? styles.pillActive : styles.pillInactive]} />

              {/* Icon with notification badge */}
              <View style={styles.iconWrap}>
                <TabIcon routeName={routeName} isFocused={isFocused} />
                {routeName === 'notifications' && (
                  <View style={styles.badgeDot} />
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? Colors.primary : Colors.tabInactive },
                  isFocused ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  pill: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  iconWrap: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.notificationBadge,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  label: {
    fontSize: 10,
    marginTop: 3,
  },
  labelActive: {
    fontFamily: 'NotoSans_700Bold',
  },
  labelInactive: {
    fontFamily: 'NotoSans_400Regular',
  },
});
