import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../ui/Avatar';
import { ProfileSheet } from './ProfileSheet';
import {
  fetchUserProfile,
  unlinkMe,
  type UserProfile,
} from '../../services/auth';
import { getStoredToken } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/auth-context';
import { isSessionEnded } from '../../lib/errors';
import { logger } from '../../lib/logger';

/** Brand header and account sheet for the paired mobile workspace. */
export function Header() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const requestVersion = useRef(0);
  const unlinkInFlight = useRef(false);
  const { signOut } = useAuth();

  const loadProfile = useCallback(() => {
    const request = ++requestVersion.current;
    return fetchUserProfile()
      .then((profile) => {
        if (request === requestVersion.current) setUser(profile);
      })
      .catch((error: unknown) => {
        if (request === requestVersion.current && !isSessionEnded(error)) {
          setProfileError(true);
          logger.warn('Could not refresh account details.');
        }
      })
      .finally(() => {
        if (request === requestVersion.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const requests = requestVersion;
    void loadProfile();
    return () => {
      requests.current++;
    };
  }, [loadProfile]);

  const handleUnlink = async () => {
    if (unlinkInFlight.current) return;
    unlinkInFlight.current = true;
    setUnlinking(true);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => undefined
      );
      // A storage read failure must not prevent the user signing out locally.
      const token = await getStoredToken().catch(() => null);
      await signOut();
      setModalVisible(false);
      if (token) void unlinkMe(token);
    } catch {
      logger.warn('Could not finish signing out. Please try again.');
      Alert.alert(
        'Could not sign out',
        'Please try unlinking this device again.'
      );
    } finally {
      unlinkInFlight.current = false;
      setUnlinking(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        <Image
          source={require('../../../assets/tiqri-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="TIQRI Assets"
        />
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open account menu"
          accessibilityHint="View your profile, device connection and account actions"
          accessibilityState={{ expanded: modalVisible }}
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.pressed,
          ]}
        >
          <Avatar
            initials={user?.initials || '--'}
            imageUrl={user?.avatarUrl}
            size="md"
          />
        </Pressable>
      </View>
      <View style={styles.separator} />
      <ProfileSheet
        visible={modalVisible}
        user={user}
        loading={loading}
        profileError={profileError}
        unlinking={unlinking}
        onClose={() => setModalVisible(false)}
        onRetry={() => {
          setLoading(true);
          setProfileError(false);
          void loadProfile();
        }}
        onUnlink={() => {
          void handleUnlink();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.card, paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  logo: { width: 120, height: 38 },
  avatarButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  pressed: { opacity: 0.7 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});
