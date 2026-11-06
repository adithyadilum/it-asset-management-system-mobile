import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  ChevronRight,
  ClipboardList,
  Globe,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { getApiUrl } from '../../constants/api';
import type { UserProfile } from '../../services/auth';
import { Avatar } from '../ui/Avatar';

interface ProfileSheetProps {
  visible: boolean;
  user: UserProfile | null;
  loading: boolean;
  profileError: boolean;
  unlinking: boolean;
  onClose: () => void;
  onRetry: () => void;
  onUnlink: () => void;
}

function workspaceHost() {
  try {
    return new URL(getApiUrl()).host;
  } catch {
    return 'Workspace unavailable';
  }
}

export function ProfileSheet({
  visible,
  user,
  loading,
  profileError,
  unlinking,
  onClose,
  onRetry,
  onUnlink,
}: ProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const network = useNetInfo();
  const router = useRouter();
  const offline = network.isConnected === false;
  const limited =
    network.isConnected === true && network.isInternetReachable === false;
  const checking = network.isConnected == null;
  const connectionLabel = offline
    ? 'Offline'
    : checking
      ? 'Checking connection'
      : limited
        ? 'Limited connectivity'
        : network.type === 'wifi'
          ? 'Wi-Fi connected'
          : network.type === 'cellular'
            ? 'Mobile data connected'
            : 'Network connected';
  const connectionColor =
    offline || limited
      ? Colors.warning
      : checking
        ? Colors.mutedForeground
        : Colors.success;
  const version = Constants.expoConfig?.version;
  const role =
    user?.role === 'GlobalAdmin'
      ? 'Global administrator'
      : user?.role === 'ITOperator'
        ? 'IT operator'
        : user?.role.replace(/([a-z])([A-Z])/g, '$1 $2');
  const system =
    [Device.osName, Device.osVersion].filter(Boolean).join(' ') ||
    'Not available';

  const openPage = (route: '/(dashboard)/my-assets' | '/(dashboard)/tasks') => {
    onClose();
    router.push(route);
  };
  const confirmUnlink = () =>
    Alert.alert(
      'Unlink this device?',
      offline
        ? 'This signs you out on this phone. While offline, remove this device from Linked Devices on the web app to revoke its pairing there too. You will need to pair again to reconnect.'
        : 'This signs you out on this phone. You will need to scan a new code from the web app to reconnect.',
      [
        { text: 'Keep linked', style: 'cancel' },
        { text: 'Unlink device', style: 'destructive', onPress: onUnlink },
      ]
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 16 }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
        />
        <View
          style={styles.sheet}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <View style={styles.handle} />
          <View style={styles.headingRow}>
            <View style={styles.flexible}>
              <Text style={styles.eyebrow}>TIQRI ASSETS</Text>
              <Text style={styles.heading} accessibilityRole="header">
                Your account
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close account menu"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={22} color={Colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            {user ? (
              <View style={styles.identity}>
                <Avatar
                  initials={user.initials}
                  imageUrl={user.avatarUrl}
                  size="lg"
                />
                <View style={styles.flexible}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.email} selectable>
                    {user.email}
                  </Text>
                  <View style={styles.roleBadge}>
                    <ShieldCheck size={14} color={Colors.primary} />
                    <Text style={styles.roleText}>{role}</Text>
                  </View>
                </View>
              </View>
            ) : loading ? (
              <View
                style={styles.loadingRow}
                accessibilityRole="progressbar"
                accessibilityLabel="Loading account details"
              >
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.body}>Loading account details...</Text>
              </View>
            ) : null}
            {profileError && (
              <View style={styles.errorCard}>
                <Text style={styles.body}>
                  Account details could not be loaded. Your device is still
                  paired.
                </Text>
                <Pressable
                  onPress={onRetry}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading account"
                  accessibilityState={{ disabled: loading }}
                  style={styles.retryButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <RefreshCw size={16} color={Colors.primary} />
                  )}
                  <Text style={styles.linkText}>Try again</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.deviceHeading}>
                <View style={styles.row}>
                  <Smartphone size={19} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>This device</Text>
                </View>
                <View style={styles.pairedBadge}>
                  <Text style={styles.pairedText}>Paired</Text>
                </View>
              </View>
              <View style={styles.deviceGrid}>
                <View style={styles.deviceColumn}>
                  <Text style={styles.label}>Device</Text>
                  <Text style={styles.value}>
                    {Device.modelName || Device.deviceName || 'Not available'}
                  </Text>
                </View>
                <View style={styles.deviceColumn}>
                  <Text style={styles.label}>System</Text>
                  <Text style={styles.value}>{system}</Text>
                </View>
              </View>
              <View style={styles.workspace}>
                <Globe size={16} color={Colors.mutedForeground} />
                <View style={styles.flexible}>
                  <Text style={styles.label}>Connected workspace</Text>
                  <Text style={styles.value} selectable>
                    {workspaceHost()}
                  </Text>
                </View>
              </View>
              <View style={styles.connection}>
                <View
                  style={[styles.dot, { backgroundColor: connectionColor }]}
                />
                <Text style={styles.connectionText}>{connectionLabel}</Text>
              </View>
              {offline && (
                <Text style={styles.note}>
                  Pairing is saved. Live updates resume when you reconnect.
                </Text>
              )}
            </View>
            <View style={styles.shortcuts}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open My assets"
                onPress={() => openPage('/(dashboard)/my-assets')}
                style={({ pressed }) => [
                  styles.shortcut,
                  styles.shortcutDivider,
                  pressed && styles.pressedRow,
                ]}
              >
                <View style={styles.shortcutIcon}>
                  <Package size={21} color={Colors.primary} />
                </View>
                <View style={styles.flexible}>
                  <Text style={styles.shortcutTitle}>My assets</Text>
                  <Text style={styles.shortcutDescription}>
                    Your equipment and software
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.mutedForeground} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Tasks"
                onPress={() => openPage('/(dashboard)/tasks')}
                style={({ pressed }) => [
                  styles.shortcut,
                  pressed && styles.pressedRow,
                ]}
              >
                <View style={styles.shortcutIcon}>
                  <ClipboardList size={21} color={Colors.primary} />
                </View>
                <View style={styles.flexible}>
                  <Text style={styles.shortcutTitle}>Tasks</Text>
                  <Text style={styles.shortcutDescription}>
                    Handovers, returns and checks
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={styles.version}>
              TIQRI Assets{version ? ` v${version}` : ''}
            </Text>
          </ScrollView>
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Pressable
              onPress={confirmUnlink}
              disabled={unlinking}
              accessibilityRole="button"
              accessibilityLabel="Unlink this device"
              accessibilityState={{ disabled: unlinking, busy: unlinking }}
              style={({ pressed }) => [
                styles.unlinkButton,
                pressed && styles.pressedRow,
                unlinking && styles.pressed,
              ]}
            >
              {unlinking ? (
                <ActivityIndicator color={Colors.destructive} size="small" />
              ) : (
                <LogOut size={19} color={Colors.destructive} />
              )}
              <Text style={styles.unlinkText}>
                {unlinking ? 'Unlinking device...' : 'Unlink this device'}
              </Text>
            </Pressable>
            <Text style={styles.footerNote}>
              This signs you out on this phone.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  flexible: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  heading: {
    fontSize: 22,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.65 },
  pressedRow: { backgroundColor: Colors.muted },
  scroll: { flexShrink: 1 },
  content: { padding: 20, gap: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  email: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginTop: 3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 9,
    maxWidth: '100%',
  },
  roleText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.primary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  body: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  errorCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSubtle,
    gap: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.primary,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: 16,
  },
  deviceHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  pairedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.muted,
  },
  pairedText: {
    fontSize: 11,
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.primary,
  },
  deviceGrid: { flexDirection: 'row', gap: 16, marginTop: 16 },
  deviceColumn: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'NotoSans_500Medium',
    color: Colors.foreground,
  },
  workspace: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: 14,
    marginTop: 16,
  },
  connection: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginTop: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  connectionText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: Colors.mutedForeground,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginTop: 6,
  },
  shortcuts: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 70,
  },
  shortcutDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.foreground,
  },
  shortcutDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unlinkText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.destructive,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    marginTop: 8,
  },
});
