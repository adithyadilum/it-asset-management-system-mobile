import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ActivityEventType } from '../../types';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  type: ActivityEventType;
  label?: string;
  className?: string;
}

const badgeConfig: Record<ActivityEventType, { color: string; label: string }> = {
  assigned: { color: Colors.status.assigned, label: 'Assigned' },
  lost: { color: Colors.status.lost, label: 'Lost' },
  repair: { color: Colors.status.repair, label: 'Repair' },
  disposed: { color: Colors.status.disposed, label: 'Disposed' },
  new: { color: Colors.status.new, label: 'New' },
};

/**
 * Small pill badge for status labels.
 * Colored dot + text, using status color tokens.
 */
export function Badge({ type, label, className = '' }: BadgeProps) {
  const config = badgeConfig[type];

  return (
    <View className={`flex-row items-center px-2 py-1 rounded-full bg-muted ${className}`}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text className="text-xs font-sans text-muted-foreground ml-1.5">
        {label || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
