import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Colors } from '../../constants/colors';
import { Platform } from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

/**
 * Shadcn-inspired card component.
 * Uses shared native colors and explicit variants.
 */
export function Card({
  variant = 'default',
  children,
  style,
  ...props
}: CardProps) {
  const variantStyle = variantStyles[variant];

  return (
    <View
      style={[
        {
          backgroundColor: Colors.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        variantStyle,
        style,
      ]}
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
    // Uses the shared border without elevation.
  },
});
