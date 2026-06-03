import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Platform } from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shadcn-inspired card component.
 * Uses StyleSheet for shadow (cross-platform) + NativeWind className passthrough.
 */
export function Card({ variant = 'default', children, style, className = '', ...props }: CardProps) {
  const variantStyle = variantStyles[variant];

  return (
    <View
      className={`bg-card rounded-2xl border border-border ${className}`}
      style={[variantStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const variantStyles = StyleSheet.create({
  default: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  outlined: {
    // No shadow, just border (handled by className)
  },
});
