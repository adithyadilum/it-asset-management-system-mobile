import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../auth-context';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { ScannerReticle } from '../../components/ui/ScannerReticle';
import { exchangeMobileToken } from '../../services/auth';

/**
 * Connect/Login screen — redesigned as modern, full-screen experience.
 * Welcome Screen → Scanner overlay.
 */
export default function ConnectScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setIsAuthenticated } = useAuth();

  const handleScan = async ({ data }: { data: string }) => {
    if (isLoading || !isScanning) return;

    setIsLoading(true);

    try {
      const token = await exchangeMobileToken(data);

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

  // ── Scanner Overlay ──
  if (isScanning) {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={isLoading ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Overlay */}
        <SafeAreaView className="flex-1 justify-between">
          <Animated.View entering={FadeIn.duration(400)} className="items-center mt-8">
            <Text style={styles.scanTitle}>Scan QR Code</Text>
            <Text style={styles.scanSubtitle}>
              Point your camera at the QR code{'\n'}on your computer screen.
            </Text>
          </Animated.View>

          {/* Scanner reticle with animated corners */}
          <View className="flex-1 items-center justify-center">
            <ScannerReticle />
          </View>

          <View className="items-center mb-8">
            {isLoading ? (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator color="#ffffff" style={{ marginRight: 12 }} />
                <Text style={styles.verifyingText}>Verifying...</Text>
              </View>
            ) : (
              <Pressable
                style={styles.cancelButton}
                onPress={() => setIsScanning(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Welcome Screen ──
  return (
    <View className="flex-1 bg-background">
      <Animated.View
        entering={FadeIn.duration(600)}
        className="flex-1 items-center justify-center px-8"
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <View className="flex-row items-center">
            <Image
              source={require('../../../assets/tiqri-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Assets</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Welcome text */}
        <View className="items-center mt-10">
          <Text className="text-2xl font-sansBold text-foreground text-center">
            Welcome back
          </Text>
          <Text className="text-sm font-sans text-muted-foreground text-center mt-2 leading-5">
            Link your device to{'\n'}get started
          </Text>
        </View>

        {/* Primary action */}
        <View className="w-full mt-10">
          <Button
            variant="default"
            size="lg"
            onPress={startScanning}
            icon={<Text style={{ fontSize: 16 }}>📷</Text>}
            className="w-full"
          >
            Scan QR Code
          </Button>
        </View>
      </Animated.View>

      {/* Footer */}
      <View className="items-center pb-10">
        <Text className="text-xs font-sans text-muted-foreground">
          Need help?{' '}
          <Text style={{ color: Colors.primary, fontFamily: 'NotoSans_700Bold' }}>
            Contact IT
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 100,
    height: 34,
  },
  logoText: {
    fontSize: 26,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primary,
    marginLeft: 3,
    marginTop: 3,
    letterSpacing: -0.5,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  scanSubtitle: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 99,
  },
  verifyingText: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  cancelText: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
  },
});