import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

type ScanMode = 'qr' | 'barcode';

/**
 * Shared scanner screen with mode selector (QR vs Barcode).
 * Features: pulsing corner reticle, haptic feedback, mode toggle.
 */
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('qr');
  const [hasScanned, setHasScanned] = useState(false);
  const router = useRouter();

  // Pulsing animation for scanner corners
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const cornerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Request permission on mount if needed
  React.useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const barcodeTypes = mode === 'qr'
    ? ['qr'] as const
    : ['code128', 'code39', 'ean13', 'ean8'] as const;

  const handleBarCodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (hasScanned) return;
    setHasScanned(true);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Scan Successful',
      `Type: ${mode === 'qr' ? 'QR Code' : 'Barcode'}\nData: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => setHasScanned(false),
        },
        {
          text: 'Done',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]
    );
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-center px-8">
          Camera permission is required to scan codes.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: barcodeTypes as any,
        }}
      />

      {/* Semi-transparent overlay */}
      <SafeAreaView className="flex-1 justify-between">
        {/* Top section — Mode selector + instructions */}
        <Animated.View entering={FadeIn.duration(400)} className="items-center mt-6 px-6">
          {/* Mode selector */}
          <View style={styles.modeSelector}>
            <Pressable
              style={[
                styles.modeButton,
                mode === 'qr' && styles.modeButtonActive,
              ]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('qr');
                setHasScanned(false);
              }}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'qr' && styles.modeTextActive,
                ]}
              >
                QR Code
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                mode === 'barcode' && styles.modeButtonActive,
              ]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('barcode');
                setHasScanned(false);
              }}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'barcode' && styles.modeTextActive,
                ]}
              >
                Barcode
              </Text>
            </Pressable>
          </View>

          <Text style={styles.instruction}>
            {mode === 'qr'
              ? 'Point camera at a QR code'
              : 'Point camera at an asset barcode'}
          </Text>
        </Animated.View>

        {/* Center — Scanner reticle */}
        <View className="flex-1 items-center justify-center">
          <View style={styles.reticleContainer}>
            {/* Corner brackets with pulse animation */}
            <Animated.View style={[styles.corner, styles.topLeft, cornerAnimatedStyle]} />
            <Animated.View style={[styles.corner, styles.topRight, cornerAnimatedStyle]} />
            <Animated.View style={[styles.corner, styles.bottomLeft, cornerAnimatedStyle]} />
            <Animated.View style={[styles.corner, styles.bottomRight, cornerAnimatedStyle]} />
          </View>
        </View>

        {/* Bottom — Cancel button */}
        <View className="items-center mb-8">
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const RETICLE_SIZE = 250;
const CORNER_SIZE = 40;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 99,
    padding: 3,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 99,
  },
  modeButtonActive: {
    backgroundColor: Colors.primaryForeground,
  },
  modeText: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeTextActive: {
    color: Colors.primary,
    fontFamily: 'NotoSans_700Bold',
  },
  instruction: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    textAlign: 'center',
  },
  reticleContainer: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: Colors.scannerCorner,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: Colors.scannerCorner,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: Colors.scannerCorner,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: Colors.scannerCorner,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  cancelText: {
    color: Colors.primaryForeground,
    fontFamily: 'NotoSans_700Bold',
    fontSize: 15,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: Colors.primaryForeground,
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
  },
});
