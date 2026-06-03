import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  imageUrl?: string;
  initials: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 12,
  md: 14,
  lg: 20,
};

/**
 * Circular avatar with image or fallback initials.
 * Navy background with white text for initials fallback.
 */
export function Avatar({ imageUrl, initials, size = 'md', className = '' }: AvatarProps) {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
        className={className}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: Colors.primary,
        },
      ]}
      className={className}
    >
      <Text style={[styles.initialsText, { fontSize }]}>
        {initials.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: Colors.primaryForeground,
    fontFamily: 'NotoSans_700Bold',
    letterSpacing: 0.5,
  },
});
