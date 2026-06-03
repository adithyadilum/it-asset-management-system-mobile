import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { ActivityEvent, ActivityEventType } from '../../types';
import { Colors } from '../../constants/colors';

interface ActivityItemProps {
  event: ActivityEvent;
}

const borderColorMap: Record<ActivityEventType, string> = {
  assigned: '#22C55E', // green
  lost: '#F97316',     // orange
  repair: '#A855F7',   // purple
  disposed: '#6B7280', // gray
  new: '#3B82F6',      // blue
};

/**
 * Activity row item with colored left border, description, and timestamp.
 * Designed for rendering inside a ScrollView (not FlatList).
 */
export function ActivityItem({ event }: ActivityItemProps) {
  const borderColor = borderColorMap[event.type] || Colors.border;

  return (
    <View style={[styles.container, { borderLeftColor: borderColor }]} className="bg-card border border-border rounded-xl mb-2">
      <View className="flex-row items-center justify-between p-3.5">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-sans text-foreground" numberOfLines={1}>
            {event.description}
          </Text>
          <Text className="text-xs font-sans text-muted-foreground mt-0.5">
            {event.assetTag} · {event.assetName}
          </Text>
        </View>
        <Text className="text-xs font-sans text-muted-foreground">
          {event.timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
});
