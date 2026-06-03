import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { KPIMetric } from '../../types';

interface KPICardProps {
  metric: KPIMetric;
}

/**
 * KPI metric card — flat, borderless surface with a soft accent icon circle.
 * Designed for side-by-side layout in a flex-row container.
 */
export function KPICard({ metric }: KPICardProps) {
  const IconComponent = metric.icon;

  return (
    <View style={[styles.card, { backgroundColor: metric.accentBg }]}>
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
        <IconComponent size={18} color={metric.accentColor} strokeWidth={2} />
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: metric.accentColor }]}>
        {metric.value}
      </Text>

      {/* Label */}
      <Text style={[styles.label, { color: metric.accentColor }]} numberOfLines={2}>
        {metric.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 28,
    fontFamily: 'NotoSans_700Bold',
    lineHeight: 32,
  },
  label: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    marginTop: 4,
    lineHeight: 16,
    opacity: 0.75,
  },
});
