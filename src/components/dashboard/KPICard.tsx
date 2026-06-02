import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { KPIMetric } from '../../types';

interface KPICardProps {
  metric: KPIMetric;
}

/**
 * KPI metric card with icon in a soft colored circle, label, and large bold number.
 * Designed for side-by-side layout in a flex-row container.
 */
export function KPICard({ metric }: KPICardProps) {
  const iconMap: Record<string, string> = {
    clipboard: '📋',
    alert: '⚠️',
  };

  return (
    <View style={styles.card} className="bg-card border border-border rounded-2xl">
      <View className="p-4">
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: metric.accentBg }]}>
          <Text style={styles.iconText}>{iconMap[metric.icon] || '•'}</Text>
        </View>

        {/* Value */}
        <Text style={[styles.value, { color: metric.accentColor }]}>
          {metric.value}
        </Text>

        {/* Label */}
        <Text className="text-xs font-sans text-muted-foreground mt-1" numberOfLines={2}>
          {metric.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 18,
  },
  value: {
    fontSize: 28,
    fontFamily: 'NotoSans_700Bold',
  },
});
