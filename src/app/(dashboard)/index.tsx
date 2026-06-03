import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Header } from '../../components/dashboard/Header';
import { ScannerCard } from '../../components/dashboard/ScannerCard';
import { KPICard } from '../../components/dashboard/KPICard';
import { ActivityList } from '../../components/dashboard/ActivityList';
import { Button } from '../../components/ui/Button';
import { fetchDashboardStats } from '../../services/dashboard';
import type { KPIMetric } from '../../types';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/auth-context';
import { LogOut, ClipboardList, CalendarClock } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

/**
 * Main dashboard screen with header, scanner CTA, KPI cards, and live activity feed.
 * Staggered fade-in animations for each section.
 * Pull-to-refresh triggers a reload of the activity list.
 */
export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { setIsAuthenticated } = useAuth();
  
  const [metrics, setMetrics] = useState<KPIMetric[]>([
    {
      label: 'My Assigned Assets',
      value: 0,
      icon: ClipboardList,
      accentColor: Colors.info,
      accentBg: Colors.infoLight,
    },
    {
      label: 'Expiring Licenses',
      value: 0,
      icon: CalendarClock,
      accentColor: Colors.warning,
      accentBg: Colors.warningLight,
    },
  ]);

  const loadStats = useCallback(async () => {
    try {
      const stats = await fetchDashboardStats();
      setMetrics([
        {
          label: 'My Assigned Assets',
          value: stats.assignedAssets,
          icon: ClipboardList,
          accentColor: Colors.info,
          accentBg: Colors.infoLight,
        },
        {
          label: 'Expiring Licenses',
          value: stats.expiringLicenses,
          icon: CalendarClock,
          accentColor: Colors.warning,
          accentBg: Colors.warningLight,
        },
      ]);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleUnlink = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await SecureStore.deleteItemAsync('secure_admin_api_key');
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Failed to unlink device', e);
    }
  };

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
          <View className="flex-row gap-3">
            {metrics.map((metric, index) => (
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

        {/* Live Activity Feed */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          className="mt-6"
        >
          <ActivityList key={refreshKey} />
        </Animated.View>

        {/* Unlink Session */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          className="mt-8 mb-6"
        >
          <Button
            variant="outline"
            onPress={handleUnlink}
            icon={<LogOut size={16} color={Colors.destructive} />}
            className="w-full"
            style={{ borderColor: Colors.destructive }}
          >
            Unlink Device
          </Button>
        </Animated.View>
      </ScrollView>
    </View>
  );
}