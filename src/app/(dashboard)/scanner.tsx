import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
  FadeOut,
} from 'react-native-reanimated';
import { Laptop, MapPin, User, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { ScannerReticle } from '../../components/ui/ScannerReticle';
import { fetchScannedAssetDetails, injectBarcode } from '../../services/scan';
import { reportAssetIssue } from '../../services/issues';
import { toMessage } from '../../lib/errors';
import { RateLimitError } from '../../constants/api';
import { AssetDetailsData } from '../../types/asset';
type ScanMode = 'qr' | 'barcode';

/**
 * Shared scanner screen with mode selector (QR vs Barcode).
 * Features: pulsing corner reticle, haptic feedback, mode toggle.
 */
/**
 * The geometry expo-camera reports varies by platform and SDK version: iOS
 * returns `bounds.origin`/`bounds.size`, Android has returned both a flat
 * `bounds` box and a `boundingBox`, and some paths only supply `cornerPoints`
 * — as objects or as `[x, y]` tuples. The published `BarcodeScanningResult`
 * type describes only one of those shapes, so it cannot be used here without
 * breaking the platforms it omits.
 *
 * This models the union the handler actually reads. Everything is optional
 * because the handler already probes each shape in turn.
 */
type ScannedPoint = {
  x?: number;
  y?: number;
  0?: number;
  1?: number;
};
type ScanGeometry = {
  data: string;
  type: string;
  bounds?: {
    origin?: {
      x: number;
      y: number;
    };
    size?: {
      width: number;
      height: number;
    };
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cornerPoints?: ScannedPoint[];
};
export default function ScannerScreen() {
  const { operation } = useLocalSearchParams<{
    operation?: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('qr');
  const operationContext = operation === 'handover' || operation === 'return';
  const scanMode: ScanMode = operationContext ? 'qr' : mode;
  const [hasScanned, setHasScanned] = useState(false);
  const permissionRequested = useRef(false);
  const scannerFocused = useRef(false);
  const scanLock = useRef(false),
    issueLock = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  /** Seconds remaining on a server-imposed cooldown; 0 when scanning is live. */
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [scannedAsset, setScannedAsset] = useState<AssetDetailsData | null>(
    null
  );
  const [showReportForm, setShowReportForm] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      scannerFocused.current = true;
      scanLock.current = false;
      setHasScanned(false);
      return () => {
        scannerFocused.current = false;
        scanLock.current = true;
      };
    }, [])
  );
  const resumeScanning = () => {
    scanLock.current = false;
    setHasScanned(false);
  };
  // Request permission on mount if needed
  React.useEffect(() => {
    if (
      permission &&
      !permission.granted &&
      permission.canAskAgain &&
      !permissionRequested.current
    ) {
      permissionRequested.current = true;
      requestPermission();
    }
  }, [permission, requestPermission]);
  const barcodeTypes = [
    'qr',
    'code128',
    'code39',
    'upc_a',
    'upc_e',
    'ean13',
    'ean8',
  ] as const;
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const handleBarCodeScanned = async (scanResult: ScanGeometry) => {
    if (
      !scannerFocused.current ||
      hasScanned ||
      scanLock.current ||
      cooldownSeconds > 0 ||
      !layout
    )
      return;
    const { data, type, bounds, cornerPoints, boundingBox } = scanResult;
    if (scanMode === 'qr' && type !== 'qr') return;
    if (scanMode === 'barcode' && type === 'qr') return;
    const reticleWidth = scanMode === 'qr' ? 250 : 320;
    const reticleHeight = scanMode === 'qr' ? 250 : 150;
    const reticleX = (layout.width - reticleWidth) / 2;
    const reticleY = (layout.height - reticleHeight) / 2;

    // Find the center of the barcode
    let barcodeCenterX;
    let barcodeCenterY;
    if (bounds && bounds.origin) {
      barcodeCenterX = bounds.origin.x + (bounds.size?.width || 0) / 2;
      barcodeCenterY = bounds.origin.y + (bounds.size?.height || 0) / 2;
    } else if (bounds && typeof bounds.x === 'number') {
      barcodeCenterX = bounds.x + (bounds.width || 0) / 2;
      barcodeCenterY = (bounds.y ?? 0) + (bounds.height || 0) / 2;
    } else if (boundingBox) {
      barcodeCenterX = boundingBox.x + boundingBox.width / 2;
      barcodeCenterY = boundingBox.y + boundingBox.height / 2;
    } else if (cornerPoints && cornerPoints.length > 0) {
      let sumX = 0;
      let sumY = 0;
      for (const p of cornerPoints) {
        sumX += p.x || p[0] || 0;
        sumY += p.y || p[1] || 0;
      }
      barcodeCenterX = sumX / cornerPoints.length;
      barcodeCenterY = sumY / cornerPoints.length;
    }
    if (barcodeCenterX !== undefined && barcodeCenterY !== undefined) {
      // Add a generous buffer (60px) to allow scanning if they are mostly inside
      const buffer = 60;
      const isInsideReticle =
        barcodeCenterX >= reticleX - buffer &&
        barcodeCenterX <= reticleX + reticleWidth + buffer &&
        barcodeCenterY >= reticleY - buffer &&
        barcodeCenterY <= reticleY + reticleHeight + buffer;
      if (!isInsideReticle) {
        return; // Ignore scan entirely
      }
    } else {
      // Strict mode: If we can't determine the location at all, we MUST ignore it,
      // otherwise it will scan everything on the screen simultaneously.
      return;
    }
    scanLock.current = true;
    setHasScanned(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {}
    );
    if (scanMode === 'barcode') {
      if (!data || data.trim().length === 0) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        Alert.alert(
          'Invalid barcode',
          'The barcode could not be read clearly.',
          [
            {
              text: 'Try Again',
              onPress: () => resumeScanning(),
            },
          ]
        );
        return;
      }
      setIsLoading(true);
      try {
        await injectBarcode(data);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
        Alert.alert('Success', 'Barcode injected successfully', [
          {
            text: 'OK',
            onPress: () => resumeScanning(),
          },
        ]);
      } catch (error) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        if (!startCooldownIfRateLimited(error)) {
          Alert.alert(
            'Invalid barcode',
            toMessage(error, 'Failed to inject barcode'),
            [
              {
                text: 'Try Again',
                onPress: () => resumeScanning(),
              },
            ]
          );
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      const asset = await fetchScannedAssetDetails(data);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      if (operation === 'handover' || operation === 'return') {
        router.replace({
          pathname:
            operation === 'handover'
              ? '/operations/handover'
              : '/operations/return',
          params: {
            assetId: asset.asset.id,
          },
        });
      } else setScannedAsset(asset);
    } catch (error) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
      if (!startCooldownIfRateLimited(error)) {
        Alert.alert(
          'Scan Failed',
          toMessage(error, 'Could not find asset details.'),
          [
            {
              text: 'Try Again',
              onPress: () => resumeScanning(),
            },
            {
              text: 'Cancel',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // A 429 pauses the viewfinder and lets it resume on its own. Stacking modal
  // alerts on every rejected scan — the previous behaviour — made a rate-limited
  // burst unusable (M-06).
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => {
      setCooldownSeconds((seconds) => {
        const next = seconds - 1;
        if (next <= 0) resumeScanning();
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  /** Returns true when the error was a rate limit and a cooldown was started. */
  const startCooldownIfRateLimited = (error: unknown): boolean => {
    if (!(error instanceof RateLimitError)) return false;
    setCooldownSeconds(error.retryAfterSeconds);
    return true;
  };
  const closeBottomSheet = () => {
    if (isSubmittingIssue) return;
    setScannedAsset(null);
    resumeScanning();
    setShowReportForm(false);
    setIssueNote('');
  };
  const handleSubmitIssue = async () => {
    if (!scannedAsset || !issueNote.trim() || issueLock.current) return;
    issueLock.current = true;
    setIsSubmittingIssue(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => {}
    );
    try {
      await reportAssetIssue(scannedAsset.asset.id, issueNote.trim());
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      Alert.alert('Success', 'Issue reported successfully.');
      setScannedAsset(null);
      resumeScanning();
      setShowReportForm(false);
      setIssueNote('');
    } catch (error) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
      Alert.alert('Error', toMessage(error, 'Failed to report issue.'));
    } finally {
      issueLock.current = false;
      setIsSubmittingIssue(false);
    }
  };
  if (!permission?.granted) {
    return (
      <View style={nativeStyles.panel}>
        <Text style={nativeStyles.container}>
          Camera permission is required to scan codes.
        </Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View
      onLayout={(e) => {
        setLayout({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
      style={nativeStyles.panel2}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: barcodeTypes as any,
        }}
      />

      {/* Center — Scanner reticle mathematically centered on the screen */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
        pointerEvents="none"
      >
        <ScannerReticle
          width={scanMode === 'qr' ? 250 : 320}
          height={scanMode === 'qr' ? 250 : 150}
        />
      </View>

      {/* Semi-transparent overlay */}
      <SafeAreaView pointerEvents="box-none" style={nativeStyles.container2}>
        {/* Top section — Mode selector + instructions */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={nativeStyles.container3}
        >
          {/* Mode selector */}
          {!operationContext && (
            <View style={styles.modeSelector}>
              <Pressable
                style={[
                  styles.modeButton,
                  scanMode === 'qr' && styles.modeButtonActive,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  ).catch(() => {});
                  setMode('qr');
                  resumeScanning();
                }}
              >
                <Text
                  style={[
                    styles.modeText,
                    scanMode === 'qr' && styles.modeTextActive,
                  ]}
                >
                  QR Code
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modeButton,
                  scanMode === 'barcode' && styles.modeButtonActive,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  ).catch(() => {});
                  setMode('barcode');
                  resumeScanning();
                }}
              >
                <Text
                  style={[
                    styles.modeText,
                    scanMode === 'barcode' && styles.modeTextActive,
                  ]}
                >
                  Barcode
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.instruction}>
            {cooldownSeconds > 0
              ? `Scanning paused — resuming in ${cooldownSeconds}s`
              : scanMode === 'qr'
                ? 'Point camera at a QR code'
                : 'Point camera at an asset barcode'}
          </Text>

          {cooldownSeconds > 0 && (
            <Text style={styles.cooldownNote}>
              The server is limiting how fast scans can be sent.
            </Text>
          )}
        </Animated.View>

        {/* Bottom — Cancel button */}
        <View style={nativeStyles.container4}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Overlay */}
      <Modal
        visible={isLoading || scannedAsset !== null}
        transparent={true}
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.bottomSheetContainer}
          >
            <TouchableWithoutFeedback onPress={closeBottomSheet}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>

            <Animated.View
              entering={SlideInDown.duration(300)}
              exiting={SlideOutDown.duration(200)}
              style={styles.bottomSheet}
            >
              <View style={nativeStyles.panel3} />

              {isLoading ? (
                <View style={nativeStyles.container5}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={nativeStyles.container6}>
                    Fetching asset details...
                  </Text>
                </View>
              ) : scannedAsset ? (
                <View style={nativeStyles.container7}>
                  {!showReportForm ? (
                    <>
                      <View style={nativeStyles.row}>
                        <View>
                          <Text style={nativeStyles.title}>
                            {scannedAsset.asset.assetTag}
                          </Text>
                          <View style={nativeStyles.row2}>
                            <View
                              style={[
                                nativeStyles.container8,
                                {
                                  backgroundColor:
                                    scannedAsset.asset.status.toLowerCase() ===
                                    'available'
                                      ? '#10b981'
                                      : scannedAsset.asset.status.toLowerCase() ===
                                          'assigned'
                                        ? '#3b82f6'
                                        : '#ef4444',
                                },
                              ]}
                            />
                            <Text
                              style={[
                                nativeStyles.text,
                                {
                                  color:
                                    scannedAsset.asset.status.toLowerCase() ===
                                    'available'
                                      ? '#10b981'
                                      : scannedAsset.asset.status.toLowerCase() ===
                                          'assigned'
                                        ? '#3b82f6'
                                        : '#ef4444',
                                },
                              ]}
                            >
                              {scannedAsset.asset.status}
                            </Text>
                          </View>
                        </View>
                        <View style={nativeStyles.panel4}>
                          <Laptop size={28} color="#1e293b" />
                        </View>
                      </View>

                      <Text style={nativeStyles.text2}>Asset Details</Text>

                      <View style={nativeStyles.container9}>
                        <View style={nativeStyles.row2}>
                          <View style={nativeStyles.panel5}>
                            <Laptop size={20} color="#64748b" />
                          </View>
                          <View>
                            <Text style={nativeStyles.text3}>Model</Text>
                            <Text style={nativeStyles.text4}>
                              {scannedAsset.model.name}
                            </Text>
                          </View>
                        </View>

                        <View style={nativeStyles.row2}>
                          <View style={nativeStyles.panel5}>
                            <MapPin size={20} color="#64748b" />
                          </View>
                          <View>
                            <Text style={nativeStyles.text3}>Location</Text>
                            <Text style={nativeStyles.text4}>
                              {scannedAsset.location?.name || 'Unknown'}
                            </Text>
                          </View>
                        </View>

                        <View style={nativeStyles.row2}>
                          <View style={nativeStyles.panel5}>
                            <User size={20} color="#64748b" />
                          </View>
                          <View>
                            <Text style={nativeStyles.text3}>Custodian</Text>
                            <Text style={nativeStyles.text4}>
                              {scannedAsset.assignment?.assignedToUser?.name ||
                                '-'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View full asset profile"
                        onPress={() => {
                          const assetId = scannedAsset.asset.id;
                          // Keep scanning paused until this screen regains focus.
                          setScannedAsset(null);
                          router.push({
                            pathname: '/asset/[assetId]',
                            params: {
                              assetId,
                            },
                          });
                        }}
                        style={nativeStyles.panel6}
                      >
                        <Text style={nativeStyles.text5}>
                          View full asset profile
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setShowReportForm(true)}
                        style={(pressState) => [
                          nativeStyles.panel7,
                          pressState.pressed && {
                            opacity: 0.9,
                          },
                        ]}
                      >
                        <Text style={nativeStyles.text6}>Report An Issue</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={nativeStyles.row3}>
                        <Pressable
                          onPress={() => setShowReportForm(false)}
                          style={nativeStyles.padded}
                        >
                          <ChevronLeft size={24} color="#1e293b" />
                        </Pressable>
                        <Text style={nativeStyles.title2}>Report an Issue</Text>
                      </View>

                      <Text style={nativeStyles.text7}>
                        {scannedAsset.asset.assetTag} ·{' '}
                        {scannedAsset.model.name}
                      </Text>

                      <TextInput
                        style={styles.issueTextArea}
                        multiline
                        numberOfLines={6}
                        maxLength={1000}
                        textAlignVertical="top"
                        placeholder="Describe any issues, damages or missing parts..."
                        placeholderTextColor="#94a3b8"
                        value={issueNote}
                        onChangeText={setIssueNote}
                      />

                      <Pressable
                        onPress={handleSubmitIssue}
                        disabled={isSubmittingIssue || !issueNote.trim()}
                        style={[
                          nativeStyles.panel8,
                          isSubmittingIssue || !issueNote.trim()
                            ? nativeStyles.container10
                            : null,
                        ]}
                      >
                        {isSubmittingIssue ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text style={nativeStyles.text6}>Submit Report</Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              ) : null}
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
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
  cooldownNote: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    fontFamily: 'NotoSans_400Regular',
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
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  bottomSheet: {
    backgroundColor: '#f5f6f8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    width: '100%',
    minHeight: 400,
  },
  issueTextArea: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 15,
    fontFamily: 'NotoSans_400Regular',
    color: '#1e293b',
    minHeight: 140,
    marginTop: 8,
  },
});
const nativeStyles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  panel2: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container2: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container3: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  container4: {
    alignItems: 'center',
    marginBottom: 32,
  },
  panel3: {
    width: 48,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 9999,
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
  },
  container5: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container6: {
    color: '#64748B',
    marginTop: 16,
    fontFamily: 'NotoSans_500Medium',
  },
  container7: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontFamily: 'NotoSans_700Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container8: {
    width: 8,
    height: 8,
    borderRadius: 9999,
    marginRight: 8,
  },
  text: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 15,
  },
  panel4: {
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
    padding: 12,
    borderRadius: 14,
  },
  text2: {
    color: '#64748B',
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    marginTop: 32,
    marginBottom: 16,
  },
  container9: {
    rowGap: 24,
  },
  panel5: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 14,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  text3: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    marginBottom: 2,
  },
  text4: {
    color: '#1E293B',
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
  },
  panel6: {
    backgroundColor: '#040D5A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  text5: {
    color: '#FFFFFF',
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
  },
  panel7: {
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  text6: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  padded: {
    marginRight: 12,
    padding: 4,
  },
  title2: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#0F172A',
  },
  text7: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    marginBottom: 8,
  },
  panel8: {
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  container10: {
    opacity: 0.5,
  },
});
