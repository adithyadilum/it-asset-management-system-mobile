import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Activity, RefreshCw } from 'lucide-react-native';
import { ActivityItem } from './ActivityItem';
import { Colors } from '../../constants/colors';
import { useRecentActivity } from '../../hooks/useRecentActivity';
import { StateMessage } from '../ui/StateMessage';

/**
 * Live activity feed component.
 * Uses useRecentActivity hook for data management and StateMessage for UI feedback.
 * Renders inside the parent ScrollView.
 */
export function ActivityList() {
  const { entries, loading, error, load } = useRecentActivity();

  // Fetch on mount is handled by the index dashboard refreshing logic typically,
  // but we can ensure it loads if not already loaded by the parent.
  // Actually, since we extracted the hook, we should keep the fetch-on-mount behavior here
  // so the component remains self-sufficient.
  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View>
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-0.5">
        <View className="flex-row items-center">
          <Activity size={16} color={Colors.foreground} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text className="text-[17px] font-sansBold text-foreground">Recent Activity</Text>
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={load}
          className="p-1.5 active:opacity-60"
          disabled={loading}
        >
          <RefreshCw size={14} color={Colors.mutedForeground} strokeWidth={2} />
        </Pressable>
      </View>

      <Text className="text-[11px] font-sans text-muted-foreground mb-3">
        Live audit trail from the IT management system
      </Text>

      {/* Loading state */}
      {loading && (
        <StateMessage type="loading" message="Loading activity…" />
      )}

      {/* Error state */}
      {!loading && error && (
        <StateMessage type="error" message={error} onRetry={load} />
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <StateMessage type="empty" message="No recent activity found." />
      )}

      {/* Activity items */}
      {!loading && !error && entries.map((entry) => (
        <ActivityItem key={entry.id} entry={entry} />
      ))}

      {/* Footer text */}
      {!loading && !error && entries.length > 0 && (
        <Text className="text-[12px] font-sans text-muted-foreground text-center mt-4 mb-2">
          You can view the full audit log on the web portal
        </Text>
      )}
    </View>
  );
}
