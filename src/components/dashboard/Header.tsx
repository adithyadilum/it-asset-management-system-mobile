import React from 'react';
import { View, Image, StyleSheet, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';
import { mockUser } from '../../data/mock';
import { Colors } from '../../constants/colors';

/**
 * Dashboard header with TIQRI logo + "Assets" text (left) and user avatar (right).
 * SafeAreaView aware — respects notch/status bar on both iOS and Android.
 */
export function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
      ]}
      className="bg-card border-b border-border"
    >
      <View className="flex-row items-center justify-between px-5 pb-3">
        {/* Logo + App name */}
        <View className="flex-row items-center">
          <Image
            source={require('../../../assets/tiqri-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Assets</Text>
        </View>

        {/* User Avatar */}
        <Avatar
          initials={mockUser.initials}
          imageUrl={mockUser.avatarUrl}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  logo: {
    width: 85,
    height: 28,
  },
  appName: {
    fontSize: 22,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primary,
    marginLeft: 2,
    marginTop: 2,
    letterSpacing: -0.5,
  },
});
