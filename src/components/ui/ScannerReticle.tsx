import React, { useEffect } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

interface ScannerReticleProps {
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  reticleSize?: number;
  width?: number;
  height?: number;
  cornerSize?: number;
  cornerThickness?: number;
}

/**
 * Reusable animated reticle overlay for scanner screens.
 * Animates corner brackets automatically on mount.
 */
export function ScannerReticle({
  borderColor = Colors.scannerCorner,
  style,
  reticleSize = 250,
  width,
  height,
  cornerSize = 40,
  cornerThickness = 4,
}: ScannerReticleProps) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const cornerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const dynamicStyles = StyleSheet.create({
    container: {
      width: width ?? reticleSize,
      height: height ?? reticleSize,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: cornerSize,
      height: cornerSize,
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: cornerThickness,
      borderLeftWidth: cornerThickness,
      borderColor,
      borderTopLeftRadius: 12,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: cornerThickness,
      borderRightWidth: cornerThickness,
      borderColor,
      borderTopRightRadius: 12,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: cornerThickness,
      borderLeftWidth: cornerThickness,
      borderColor,
      borderBottomLeftRadius: 12,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: cornerThickness,
      borderRightWidth: cornerThickness,
      borderColor,
      borderBottomRightRadius: 12,
    },
  });

  return (
    <View style={[dynamicStyles.container, style]}>
      <Animated.View style={[dynamicStyles.corner, dynamicStyles.topLeft, cornerAnimatedStyle]} />
      <Animated.View style={[dynamicStyles.corner, dynamicStyles.topRight, cornerAnimatedStyle]} />
      <Animated.View style={[dynamicStyles.corner, dynamicStyles.bottomLeft, cornerAnimatedStyle]} />
      <Animated.View style={[dynamicStyles.corner, dynamicStyles.bottomRight, cornerAnimatedStyle]} />
    </View>
  );
}
