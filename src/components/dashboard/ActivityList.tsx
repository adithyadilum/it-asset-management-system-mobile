import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
      <View style={nativeStyles.row}>
        <View style={nativeStyles.row2}>
          <Activity
            size={16}
            color={Colors.foreground}
            strokeWidth={2}
            style={{
              marginRight: 6,
            }}
          />
          <Text style={nativeStyles.title}>Recent Activity</Text>
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={load}
          disabled={loading}
          style={(pressState) => [
            nativeStyles.padded,
            pressState.pressed && {
              opacity: 0.6,
            },
          ]}
        >
          <RefreshCw size={14} color={Colors.mutedForeground} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={nativeStyles.text}>
        Live audit trail from the IT management system
      </Text>

      {/* Loading state */}
      {loading && <StateMessage type="loading" message="Loading activity…" />}

      {/* Error state */}
      {!loading && error && (
        <StateMessage type="error" message={error} onRetry={load} />
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <StateMessage type="empty" message="No recent activity found." />
      )}

      {/* Activity items */}
      {!loading &&
        !error &&
        entries.map((entry) => <ActivityItem key={entry.id} entry={entry} />)}

      {/* Footer text */}
      {!loading && !error && entries.length > 0 && (
        <Text style={nativeStyles.text2}>
          You can view the full audit log on the web portal
        </Text>
      )}
    </View>
  );
}
const nativeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'NotoSans_700Bold',
    color: '#0F172A',
  },
  padded: {
    padding: 6,
  },
  text: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    marginBottom: 12,
  },
  text2: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});
