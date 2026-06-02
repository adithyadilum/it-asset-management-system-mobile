import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Large pressable scanner CTA card (~40% of viewport).
 * Navy gradient feel, camera icon, press animation via Reanimated.
 */
export function ScannerCard() {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(dashboard)/scanner');
  };

  return (
    <AnimatedPressable
      style={[animatedStyle, styles.card]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      {/* Navy background with subtle gradient effect using layered views */}
      <View style={styles.cardBg}>
        {/* Subtle dot pattern overlay for premium texture */}
        <View style={styles.patternOverlay} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.cameraIcon}>📷</Text>
        </View>
        <Text style={styles.title}>Launch Scanner</Text>
        <Text style={styles.subtitle}>
          Instantly scan asset barcodes{'\n'}and QR codes
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 26, 138, 0.3)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primaryForeground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
