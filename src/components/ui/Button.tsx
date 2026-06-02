import React from 'react';
import { Pressable, Text, StyleSheet, type PressableProps, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: string;
  className?: string;
  textClassName?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  outline: 'bg-transparent border-2 border-primary',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  default: 'text-primary-foreground',
  outline: 'text-primary',
  ghost: 'text-primary',
  destructive: 'text-destructive-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Pressable button with Reanimated spring scale animation on press.
 * Supports variant (default/outline/ghost/destructive) and size (sm/md/lg).
 * Children must be a string — automatically wrapped in styled <Text>.
 */
export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  textClassName = '',
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
    <AnimatedPressable
      className={`flex-row items-center justify-center rounded-lg ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={[animatedStyle, styles.button]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {icon && <Animated.View className="mr-2">{icon}</Animated.View>}
      <Text className={`font-sansBold ${variantTextClasses[variant]} ${sizeTextClasses[size]} ${textClassName}`}>
        {children}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});
