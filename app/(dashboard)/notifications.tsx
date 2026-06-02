import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../src/constants/colors';

/**
 * Notifications placeholder screen with styled "Coming Soon" empty state.
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Animated.View
        entering={FadeIn.duration(500)}
        className="flex-1 items-center justify-center px-8"
      >
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        {/* Heading */}
        <Text className="text-2xl font-sansBold text-foreground mt-6 text-center">
          Notifications
        </Text>

        {/* Subtitle */}
        <Text className="text-sm font-sans text-muted-foreground mt-2 text-center leading-5">
          This feature is coming soon.{'\n'}
          You'll receive alerts about asset{'\n'}
          updates and approvals here.
        </Text>

        {/* Decorative pill */}
        <View style={styles.pill}>
          <Text style={styles.pillText}>Coming Soon</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
  pill: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: Colors.muted,
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.mutedForeground,
    letterSpacing: 0.5,
  },
});
