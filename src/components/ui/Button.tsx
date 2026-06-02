import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type PressableProps,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: string;
  /** Extra style overrides for the outer wrapper View */
  style?: object;
}

/**
 * Pressable button with Reanimated spring scale animation on press.
 * Uses plain StyleSheet — no NativeWind className dependency.
 * Supports variant (default/outline/ghost/destructive) and size (sm/md/lg).
 */
export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
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

  return (
    <View style={style}>
      <Animated.View style={animatedStyle}>
        <Pressable
          style={[
            styles.base,
            variantStyles[variant],
            sizeStyles[size],
            disabled ? styles.disabled : null,
            ...Platform.select({
              ios: [shadow.ios],
              android: [shadow.android],
              default: [],
            }),
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          {...props}
        >
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[styles.baseText, variantTextStyles[variant], sizeTextStyles[size]]}>
            {children}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    marginRight: 8,
  },
  baseText: {
    fontFamily: 'NotoSans_700Bold',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: Colors.destructive,
  },
});

const variantTextStyles = StyleSheet.create({
  default: {
    color: Colors.primaryForeground,
  },
  outline: {
    color: Colors.primary,
  },
  ghost: {
    color: Colors.primary,
  },
  destructive: {
    color: Colors.destructiveForeground,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 16, paddingVertical: 10 },
  md: { paddingHorizontal: 24, paddingVertical: 14 },
  lg: { paddingHorizontal: 32, paddingVertical: 18 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 18 },
});

const shadow = StyleSheet.create({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 2,
  },
});
