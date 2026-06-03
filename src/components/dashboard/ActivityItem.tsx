import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ActivityLogEntry } from '../../services/activity';
import { Colors } from '../../constants/colors';

interface ActivityItemProps {
  entry: ActivityLogEntry;
}

/**
 * Color map that mirrors ACTION_BADGE_STYLES from the web audit-log table.
 * Each action gets a { bg, text } pair so the badge matches the brand palette.
 */
const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE:             { bg: '#ECFDF5', text: '#059669' },
  UPDATE:             { bg: '#EFF6FF', text: '#2563EB' },
  DELETE:             { bg: '#FFF1F2', text: '#E11D48' },
  ASSIGN:             { bg: '#EEF2FF', text: '#4F46E5' },
  RETURN:             { bg: '#F0FDF4', text: '#16A34A' },
  STATUS_CHANGE:      { bg: '#FFF7ED', text: '#EA580C' },
  REPAIR_INITIATED:   { bg: '#FAF5FF', text: '#9333EA' },
  REPAIR_COMPLETED:   { bg: '#F0FDF4', text: '#15803D' },
  RESOLVED_INTERNALLY:{ bg: '#F0FDF4', text: '#15803D' },
  LOGIN:              { bg: '#F5F3FF', text: '#7C3AED' },
  LOGOUT:             { bg: '#F8FAFC', text: '#64748B' },
  ACCESS_DENIED:      { bg: '#FFF1F2', text: '#BE123C' },
  IMPORT:             { bg: '#FFFBEB', text: '#D97706' },
  API_KEY_CREATED:    { bg: '#EFF6FF', text: '#1D4ED8' },
  API_KEY_REVOKED:    { bg: '#FFF1F2', text: '#DC2626' },
  WEBHOOK_CREATED:    { bg: '#EFF6FF', text: '#2563EB' },
  WEBHOOK_UPDATED:    { bg: '#FFF7ED', text: '#EA580C' },
  WEBHOOK_DELETED:    { bg: '#FFF1F2', text: '#DC2626' },
  EXTERNAL_API_ACCESS:{ bg: '#F0FDF4', text: '#16A34A' },
  DEVICE_LINKED:      { bg: '#EFF6FF', text: '#2563EB' },
  DEVICE_UNLINKED:    { bg: '#F8FAFC', text: '#64748B' },
};

const DEFAULT_ACTION_COLOR = { bg: '#F1F5F9', text: Colors.mutedForeground };

/** Converts a timestamp to a concise relative string for the mobile list. */
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Activity row for the dashboard feed.
 *
 * Layout:
 *   [ ACTION badge ]  event description (muted)       timestamp
 *                     entityLabel (smaller, muted)
 *
 * The `action` field gets a semantically colored pill badge.
 * The `event` field is rendered in normal foreground color.
 */
export function ActivityItem({ entry }: ActivityItemProps) {
  const color = ACTION_COLORS[entry.action.toUpperCase()] ?? DEFAULT_ACTION_COLOR;
  const relativeTime = formatRelativeTime(entry.performedAt);

  return (
    <View style={styles.container}>
      {/* Top row: action badge + event text + timestamp */}
      <View style={styles.topRow}>
        {/* Action badge */}
        <View style={[styles.badge, { backgroundColor: color.bg }]}>
          <Text style={[styles.badgeText, { color: color.text }]}>
            {entry.action.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Timestamp — pushed to the right */}
        <Text style={styles.timestamp}>{relativeTime}</Text>
      </View>

      {/* Event description — normal weight, foreground color */}
      <Text style={styles.event} numberOfLines={2}>
        {entry.event}
      </Text>

      {/* Entity label — smaller, muted */}
      {entry.entityLabel ? (
        <Text style={styles.entity} numberOfLines={1}>
          {entry.entityLabel}
        </Text>
      ) : null}

      {/* Performer — smallest, most muted */}
      {entry.performedBy ? (
        <Text style={styles.performer} numberOfLines={1}>
          {entry.performedBy.name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'NotoSans_700Bold',
    letterSpacing: 0.4,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: '#94A3B8',
  },
  event: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.foreground,
    lineHeight: 19,
    marginBottom: 3,
  },
  entity: {
    fontSize: 11,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  performer: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: '#94A3B8',
  },
});
