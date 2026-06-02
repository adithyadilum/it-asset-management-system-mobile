import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Header } from '../../components/dashboard/Header';
import { ScannerCard } from '../../components/dashboard/ScannerCard';
import { KPICard } from '../../components/dashboard/KPICard';
import { ActivityList } from '../../components/dashboard/ActivityList';
import { mockMetrics } from '../../data/mock';

/**
 * Main dashboard screen with header, scanner CTA, KPI cards, and activity list.
 * Staggered fade-in animations for each section.
 * Pull-to-refresh ready for future API integration.
 */
export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh — future: re-fetch from API
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <View className="flex-1 bg-background">
      {/* Sticky header */}
      <Header />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Scanner CTA Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          className="mt-5"
        >
          <ScannerCard />
        </Animated.View>

        {/* Quick Metrics */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          className="mt-5"
        >
          <View className="flex-row gap-3">
            {mockMetrics.map((metric, index) => (
              <Animated.View
                key={metric.label}
                entering={FadeInDown.delay(200 + index * 50).duration(500).springify()}
                style={{ flex: 1 }}
              >
                <KPICard metric={metric} />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activities */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          className="mt-6"
        >
          <ActivityList />
        </Animated.View>
      </ScrollView>
    </View>
  );
}