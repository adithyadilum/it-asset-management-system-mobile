import React from 'react';
import { View, Text } from 'react-native';
import { Activity } from 'lucide-react-native';
import { ActivityItem } from './ActivityItem';
import { mockActivities } from '../../data/mock';
import { Colors } from '../../constants/colors';

/**
 * Activity list section with header (Lucide icon + title) and mapped ActivityItem components.
 * Renders inside the parent ScrollView (not a nested FlatList to avoid VirtualizedList warnings).
 */
export function ActivityList() {
  return (
    <View>
      {/* Section header */}
      <View className="mb-3">
        <View className="flex-row items-center mb-0.5">
          <Activity size={16} color={Colors.foreground} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text className="text-lg font-sansBold text-foreground">
            Recent Activities
          </Text>
        </View>
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
