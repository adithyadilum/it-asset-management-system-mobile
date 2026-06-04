import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { QrCode, Smartphone, Laptop, HelpCircle, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth-context';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { ScannerReticle } from '../../components/ui/ScannerReticle';
import { exchangeMobileToken } from '../../services/auth';
import { decodeJwt } from '../../lib/jwt';

const SCANNER_SIZE = 260;

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setIsAuthenticated } = useAuth();

  const handleScan = async ({ data }: { data: string }) => {
    if (isLoading || !isScanning) return;

    setIsLoading(true);

    try {
      const token = await exchangeMobileToken(data);

      // Defence-in-depth: verify the role embedded in the JWT before storing it.
      // The backend already rejects non-admin users with a 403, but this check
      // provides a clear, user-facing error if the token somehow has the wrong role.
      const payload = decodeJwt(token);
      if (payload?.role !== 'GlobalAdmin') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Access Denied',
          'This app is restricted to Global Administrators. Your account does not have the required permissions.',
          [{ text: 'OK', onPress: () => { setIsScanning(false); setIsLoading(false); } }]
        );
        return;
      }

      await SecureStore.setItemAsync('secure_admin_api_key', token);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Scan Error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Pairing Failed',
        error.message || 'The QR code was invalid or expired. Please try again.',
        [{
          text: 'OK',
          onPress: () => {
            setIsScanning(false);
            setIsLoading(false);
          }
        }]
      );
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan the QR code.');
        return;
      }
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsScanning(true);
  };

  const stopScanning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsScanning(false);
  };

  // ── Scanner Overlay ──
  if (isScanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={isLoading ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Viewfinder Masking */}
        <View style={styles.scannerOverlay}>
          {/* Top Mask */}
          <View
            style={[
              styles.topMask,
              { paddingTop: Math.max(insets.top, 24) }
            ]}
          >
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.topMaskContent}
            >
              <View style={styles.qrIconBadge}>
                <QrCode size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.scanTitle}>
                Scan Pairing QR Code
              </Text>
              <Text style={styles.scanSubtitle}>
                Align the QR code from the IT Web Portal{'\n'}within the viewfinder window.
              </Text>
            </Animated.View>
          </View>

          {/* Middle Row (Left Mask + Clear Viewfinder + Right Mask) */}
          <View style={[styles.middleRow, { height: SCANNER_SIZE }]}>
            <View style={styles.sideMask} />
            <View style={[styles.viewfinderArea, { width: SCANNER_SIZE, height: SCANNER_SIZE }]}>
              <ScannerReticle reticleSize={SCANNER_SIZE} />
            </View>
            <View style={styles.sideMask} />
          </View>

          {/* Bottom Mask */}
          <View
            style={[
              styles.bottomMask,
              { paddingTop: 30, paddingBottom: Math.max(insets.bottom, 24) }
            ]}
          >
            {isLoading ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.verifyingContainer}
              >
                <ActivityIndicator color="#ffffff" style={styles.verifyingIcon} />
                <Text style={styles.verifyingText}>Verifying...</Text>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={stopScanning}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Welcome Screen ──
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.brandHeader}
        >
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/tiqri-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Middle content */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.middleContent}
        >
          {/* Welcome Text */}
          <View style={styles.welcomeTextContainer}>
            <View style={styles.smartphoneIconBadge}>
              <Smartphone size={32} color={Colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>
              Link Admin Account
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Pair this mobile device with your Web Portal to begin managing assets.
            </Text>
          </View>

          {/* Setup Instructions Callout */}
          <View style={styles.instructionsCallout}>
            <View style={styles.instructionsHeader}>
              <Laptop size={16} color={Colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={styles.instructionsTitle}>
                Setup Instructions
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Log in to the Web Portal on your computer.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Navigate to Settings &gt; Profile, and find the <Text style={styles.stepTextBold}>Link Device</Text> section.
              </Text>
            </View>

            <View style={styles.stepRowLast}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Tap <Text style={styles.stepTextBold}>Scan QR Code</Text> below and aim your camera at the screen.
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <Button
            variant="default"
            size="lg"
            onPress={startScanning}
            icon={<QrCode size={20} color="#FFFFFF" />}
            style={styles.scanButton}
          >
            Scan QR Code
          </Button>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(300).duration(500)}
          style={styles.footerContainer}
        >
          <Pressable
            onPress={() => Alert.alert('Help & Support', 'For questions or troubleshooting, contact the IT service desk at support@tiqri.com or ext 4400.')}
            style={styles.footerPressable}
          >
            <HelpCircle size={16} color={Colors.mutedForeground} style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>
              Need help? <Text style={styles.footerTextBold}>Contact IT Support</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  middleContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  smartphoneIconBadge: {
    padding: 14,
    backgroundColor: 'rgba(4, 13, 90, 0.05)',
    borderRadius: 100,
    marginBottom: 16,
  },
  instructionsCallout: {
    backgroundColor: 'rgba(241, 245, 249, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepRowLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
  },
  topMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  topMaskContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qrIconBadge: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    marginBottom: 12,
  },
  middleRow: {
    flexDirection: 'row',
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  viewfinderArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  verifyingIcon: {
    marginRight: 10,
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 76,
  },
  scanButton: {
    width: '100%',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 99,
    minWidth: 145,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    maxWidth: 290,
  },
  instructionsTitle: {
    fontSize: 13,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(4, 13, 90, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primary,
  },
  stepText: {
    fontSize: 15,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    flex: 1,
    lineHeight: 22,
  },
  stepTextBold: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.foreground,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
  },
  footerTextBold: {
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primary,
  },
  scanTitle: {
    fontSize: 22,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scanSubtitle: {
    fontSize: 15,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 300,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
  },
  verifyingText: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
  },
});