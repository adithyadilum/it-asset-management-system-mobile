import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { KPIMetric } from '../../types';

interface KPICardProps {
  metric: KPIMetric;
}

/**
 * KPI metric card — professional white surface with subtle borders and shadows.
 * Designed for side-by-side layout in a flex-row container.
 */
export function KPICard({ metric }: KPICardProps) {
  const IconComponent = metric.icon;

  return (
    <View style={styles.card}>
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: metric.accentBg }]}>
        <IconComponent size={20} color={metric.accentColor} strokeWidth={2.5} />
      </View>

      {/* Value */}
      <Text style={styles.value}>
        {metric.value}
      </Text>

      {/* Label */}
      <Text style={styles.label} numberOfLines={2}>
        {metric.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6', // very subtle gray-100 border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  value: {
    fontSize: 28,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827', // dark charcoal / gray-900
    lineHeight: 32,
  },
  label: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280', // readable medium gray / gray-500
    marginTop: 4,
    lineHeight: 18,
  },
});
