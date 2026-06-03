import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Modal, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';
import { fetchUserProfile, type UserProfile } from '../../services/auth';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../app/auth-context';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { X, LogOut, Smartphone, ShieldCheck } from 'lucide-react-native';

/**
 * Dashboard header with TIQRI logo (left) and user avatar (right).
 * Tapping the user avatar opens a premium Gmail-style profile screen
 * overlay with detailed user/role information and device linking status.
 * SafeAreaView aware: respects notch/status bar on iOS & Android.
 */
export function Header() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { setIsAuthenticated } = useAuth();

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const profile = await fetchUserProfile();
        if (active) {
          setUser(profile);
        }
      } catch (err) {
        console.error('Failed to load user profile in Header:', err);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleUnlink = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(false);
    try {
      await SecureStore.deleteItemAsync('secure_admin_api_key');
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Failed to unlink device', e);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        {/* Logo */}
        <Image
          source={require('../../../assets/tiqri-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* User Avatar */}
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => pressed && { opacity: 0.8 }}
        >
          <Avatar
            initials={user?.initials || '--'}
            imageUrl={user?.avatarUrl}
            size="md"
          />
        </Pressable>
      </View>

      {/* Hairline separator — brand-tinted, not harsh */}
      <View style={styles.separator} />

      {/* Gmail style profile modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
              >
                <X size={20} color={Colors.foreground} />
              </Pressable>

              <Image
                source={require('../../../assets/tiqri-logo.png')}
                style={styles.modalLogo}
                resizeMode="contain"
              />

              {/* Dummy view to balance close button */}
              <View style={{ width: 28 }} />
            </View>

            {/* Profile Info */}
            <View style={styles.profileSection}>
              <Avatar
                initials={user?.initials || '--'}
                imageUrl={user?.avatarUrl}
                size="lg"
              />

              <Text style={styles.profileName}>
                {user?.name || 'Loading user…'}
              </Text>

              <Text style={styles.profileEmail}>
                {user?.email || ''}
              </Text>

              {user?.role && (
                <View style={styles.roleBadge}>
                  <ShieldCheck size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.roleBadgeText}>
                    {user.role.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </View>
              )}
            </View>

            {/* Device Info Card (Gmail Style "Manage your Account" / details box) */}
            <View style={styles.deviceCard}>
              <View style={styles.deviceHeaderRow}>
                <Smartphone size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.deviceHeaderTitle}>This Linked Device</Text>
              </View>

              <View style={styles.deviceDetails}>
                <View>
                  <Text style={styles.deviceLabel}>Device Model</Text>
                  <Text style={styles.deviceValue}>{Device.modelName || 'Unknown Device'}</Text>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={styles.deviceLabel}>Operating System</Text>
                  <Text style={styles.deviceValue}>
                    {Device.osName || 'OS'} {Device.osVersion || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.connectionStatus}>
                <View style={styles.greenDot} />
                <Text style={styles.connectionText}>Active Secure Connection</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Row */}
            <Pressable
              onPress={handleUnlink}
              style={({ pressed }) => [
                styles.unlinkRow,
                pressed && { backgroundColor: Colors.muted }
              ]}
            >
              <LogOut size={16} color={Colors.destructive} style={{ marginRight: 10 }} />
              <Text style={styles.unlinkText}>Unlink Companion Device</Text>
            </Pressable>

            {/* Footer links */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  logo: {
    width: 120,
    height: 38,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
    borderRadius: 100,
  },
  modalLogo: {
    width: 70,
    height: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    marginTop: 12,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginTop: 2,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primary,
  },
  deviceCard: {
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  deviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceHeaderTitle: {
    fontSize: 12,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  deviceDetails: {
    paddingLeft: 22,
  },
  deviceLabel: {
    fontSize: 10,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceValue: {
    fontSize: 12,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    marginTop: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 22,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  unlinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  unlinkText: {
    fontSize: 13,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.destructive,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerLink: {
    fontSize: 10,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  footerDot: {
    fontSize: 10,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginHorizontal: 6,
  },
});
