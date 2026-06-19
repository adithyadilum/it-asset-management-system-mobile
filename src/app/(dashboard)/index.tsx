import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Header } from '../../components/dashboard/Header';
import { ScannerCard } from '../../components/dashboard/ScannerCard';
import { KPICard } from '../../components/dashboard/KPICard';
import { ActivityList } from '../../components/dashboard/ActivityList';
import { Colors } from '../../constants/colors';
import { useDashboardStats } from '../../hooks/useDashboardStats';

/**
 * Main dashboard screen with header, scanner CTA, KPI cards, and live activity feed.
 * Staggered fade-in animations for each section.
 * Pull-to-refresh triggers a reload of the activity list.
 */
export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { metrics, loadStats } = useDashboardStats();

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Bumping refreshKey causes ActivityList to remount and re-fetch
    setRefreshKey((k) => k + 1);
    loadStats().finally(() => {
      setTimeout(() => setRefreshing(false), 1500);
    });
  }, [loadStats]);

  return (
    <View className="flex-1 bg-background">
      {/* Sticky header */}
      <Header />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
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
          <View className="gap-3">
            <View className="flex-row gap-3">
              {metrics.slice(0, 2).map((metric, index) => (
                <Animated.View
                  key={metric.label}
                  entering={FadeInDown.delay(200 + index * 50).duration(500).springify()}
                  style={{ flex: 1 }}
                >
                  <KPICard metric={metric} />
                </Animated.View>
              ))}
            </View>
            <View className="flex-row gap-3">
              {metrics.slice(2, 4).map((metric, index) => (
                <Animated.View
                  key={metric.label}
                  entering={FadeInDown.delay(300 + index * 50).duration(500).springify()}
                  style={{ flex: 1 }}
                >
                  <KPICard metric={metric} />
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Live Activity Feed */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          className="mt-6"
        >
          <ActivityList key={refreshKey} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}