import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Header } from '../../components/dashboard/Header';
import { ScannerCard } from '../../components/dashboard/ScannerCard';
import { KPICard } from '../../components/dashboard/KPICard';
import { ActivityList } from '../../components/dashboard/ActivityList';
import { mockMetrics } from '../../data/mock';
import { Button } from '../../components/ui/Button';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/auth-context';
import { LogOut } from 'lucide-react-native';
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
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

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