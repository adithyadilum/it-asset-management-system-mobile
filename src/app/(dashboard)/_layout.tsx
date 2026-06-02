import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../components/navigation/TabBar';

/**
 * Dashboard group layout with bottom tab navigator.
 * Three visible tabs: Home, My Assets, Notifications.
 * Scanner is a hidden route accessible via push navigation.
 */
export default function DashboardLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="my-assets"
        options={{
          title: 'My Assets',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
