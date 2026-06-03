import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Package } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

/**
 * My Assets placeholder screen with styled "Coming Soon" empty state.
 */
export default function MyAssetsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Animated.View
        entering={FadeIn.duration(500)}
        className="flex-1 items-center justify-center px-8"
      >
        {/* Icon circle */}
        <View style={styles.iconCircle}>
          <Package size={36} color={Colors.info} strokeWidth={1.75} />
        </View>

        {/* Heading */}
        <Text className="text-2xl font-sansBold text-foreground mt-6 text-center">
          My Assets
        </Text>

        {/* Subtitle */}
        <Text className="text-sm font-sans text-muted-foreground mt-2 text-center leading-5">
          This feature is coming soon.{'\n'}
          You'll be able to view and manage{'\n'}
          your assigned assets here.
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
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
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
