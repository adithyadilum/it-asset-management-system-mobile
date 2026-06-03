import React from 'react';
import { View, Text } from 'react-native';
import { ActivityItem } from './ActivityItem';
import { mockActivities } from '../../data/mock';

/**
 * Activity list section with header and mapped ActivityItem components.
 * Renders inside the parent ScrollView (not a nested FlatList to avoid VirtualizedList warnings).
 */
export function ActivityList() {
  return (
    <View>
      {/* Section header */}
      <View className="mb-3">
        <Text className="text-lg font-sansBold text-foreground">
          Recent Activities
        </Text>
        <Text className="text-xs font-sans text-muted-foreground mt-0.5">
          Latest actions, updates, and system events
        </Text>
      </View>

      {/* Activity items */}
      {mockActivities.map((event) => (
        <ActivityItem key={event.id} event={event} />
      ))}
    </View>
  );
}
