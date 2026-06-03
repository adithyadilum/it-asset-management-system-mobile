import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  UserCheck,
  AlertOctagon,
  Wrench,
  Trash2,
  PackagePlus,
} from 'lucide-react-native';
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

const iconMap: Record<ActivityEventType, React.ReactElement> = {
  assigned: <UserCheck size={14} color="#22C55E" strokeWidth={2} />,
  lost: <AlertOctagon size={14} color="#F97316" strokeWidth={2} />,
  repair: <Wrench size={14} color="#A855F7" strokeWidth={2} />,
  disposed: <Trash2 size={14} color="#6B7280" strokeWidth={2} />,
  new: <PackagePlus size={14} color="#3B82F6" strokeWidth={2} />,
};

/**
 * Activity row item with colored left border, Lucide status icon, description, and timestamp.
 * Designed for rendering inside a ScrollView (not FlatList).
 */
export function ActivityItem({ event }: ActivityItemProps) {
  const borderColor = borderColorMap[event.type] || Colors.border;
  const iconElement = iconMap[event.type];

  return (
    <View style={[styles.container, { borderLeftColor: borderColor }]} className="bg-card border border-border rounded-xl mb-2">
      <View className="flex-row items-center justify-between p-3.5">
        <View className="flex-row items-center flex-1 mr-3">
          {/* Status icon */}
          <View style={styles.iconWrapper}>
            {iconElement}
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-sans text-foreground" numberOfLines={1}>
              {event.description}
            </Text>
            <Text className="text-xs font-sans text-muted-foreground mt-0.5">
              {event.assetTag} · {event.assetName}
            </Text>
          </View>
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
    borderLeftWidth: 3,
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
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
});
