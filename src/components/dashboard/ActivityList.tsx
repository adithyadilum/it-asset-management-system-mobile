import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { Activity, RefreshCw } from 'lucide-react-native';
import { ActivityItem } from './ActivityItem';
import { fetchRecentActivity, type ActivityLogEntry } from '../../services/activity';
import { Colors } from '../../constants/colors';

/**
 * Live activity feed component.
 * Fetches recent system audit log entries from the web API,
 * with an inline loading state, error fallback, and manual refresh button.
 *
 * Renders inside the parent ScrollView — not a nested FlatList.
 */
export function ActivityList() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchRecentActivity();
      setEntries(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    load();
  }, [load]);

  return (
    <View>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={16} color={Colors.foreground} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Recent Activity</Text>
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={load}
          style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.6 }]}
          disabled={loading}
        >
          <RefreshCw size={14} color={Colors.mutedForeground} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={styles.headerSub}>
        Live audit trail from the IT management system
      </Text>

      {/* Loading state */}
      {loading && (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading activity…</Text>
        </View>
      )}

      {/* Error state */}
      {!loading && error && (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <View style={styles.centeredState}>
          <Text style={styles.stateText}>No recent activity found.</Text>
        </View>
      )}

      {/* Activity items */}
      {!loading && !error && entries.map((entry) => (
        <ActivityItem key={entry.id} entry={entry} />
      ))}

      {/* Footer text */}
      {!loading && !error && entries.length > 0 && (
        <Text style={styles.footerText}>
          You can view the full audit log on the web portal
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginBottom: 12,
  },
  refreshButton: {
    padding: 6,
  },
  centeredState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.destructive,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});
