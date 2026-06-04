import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, TouchableWithoutFeedback, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOutDown, SlideInDown, SlideOutDown, FadeOut } from 'react-native-reanimated';
import { Laptop, MapPin, User, X, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { ScannerReticle } from '../../components/ui/ScannerReticle';
import { fetchScannedAssetDetails } from '../../services/scan';
import { reportAssetIssue } from '../../services/issues';
import { AssetDetailsData } from '../../types/asset';

type ScanMode = 'qr' | 'barcode';

/**
 * Shared scanner screen with mode selector (QR vs Barcode).
 * Features: pulsing corner reticle, haptic feedback, mode toggle.
 */
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('qr');
  const [hasScanned, setHasScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<AssetDetailsData | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const router = useRouter();

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

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    const result = await fetchScannedAssetDetails(data);
    setIsLoading(false);

    if (result.success && result.data) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScannedAsset(result.data);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Scan Failed',
        result.error || 'Could not find asset details.',
        [
          { text: 'Try Again', onPress: () => setHasScanned(false) },
          { text: 'Cancel', onPress: () => router.back(), style: 'cancel' }
        ]
      );
    }
  };

  const closeBottomSheet = () => {
    if (isSubmittingIssue) return;
    setScannedAsset(null);
    setHasScanned(false);
    setShowReportForm(false);
    setIssueNote('');
  };

  const handleSubmitIssue = async () => {
    if (!scannedAsset || !issueNote.trim()) return;

    setIsSubmittingIssue(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await reportAssetIssue(scannedAsset.asset.id, issueNote);

    setIsSubmittingIssue(false);

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Issue reported successfully.');
      closeBottomSheet();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', result.error || 'Failed to report issue.');
    }
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
          <ScannerReticle />
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

      {/* Bottom Sheet Overlay */}
      <Modal
        visible={isLoading || scannedAsset !== null}
        transparent={true}
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={StyleSheet.absoluteFillObject}
        >
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.bottomSheetContainer}
          >
            <TouchableWithoutFeedback onPress={closeBottomSheet}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>

          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={styles.bottomSheet}
          >
            <View className="w-12 h-1 bg-slate-200 rounded-full mt-4 mb-2 self-center" />

            {isLoading ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text className="text-slate-500 mt-4 font-['NotoSans_500Medium']">Fetching asset details...</Text>
              </View>
            ) : scannedAsset ? (
              <View className="px-6 pb-6 pt-2">
                {!showReportForm ? (
                  <>
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="text-2xl font-['NotoSans_700Bold'] text-slate-900 mb-1">
                          {scannedAsset.asset.assetTag}
                        </Text>
                        <View className="flex-row items-center">
                          <View 
                            className="w-2 h-2 rounded-full mr-2" 
                            style={{ 
                              backgroundColor: scannedAsset.asset.status.toLowerCase() === 'available' ? '#10b981' : 
                                               scannedAsset.asset.status.toLowerCase() === 'assigned' ? '#3b82f6' : '#ef4444' 
                            }} 
                          />
                          <Text className="font-['NotoSans_600SemiBold'] text-[15px]"
                                style={{
                                  color: scannedAsset.asset.status.toLowerCase() === 'available' ? '#10b981' : 
                                         scannedAsset.asset.status.toLowerCase() === 'assigned' ? '#3b82f6' : '#ef4444'
                                }}>
                            {scannedAsset.asset.status}
                          </Text>
                        </View>
                      </View>
                      <View className="bg-[#e2e8f0]/60 p-3 rounded-xl">
                        <Laptop size={28} color="#1e293b" />
                      </View>
                    </View>

                    <Text className="text-slate-500 font-['NotoSans_600SemiBold'] text-base mt-8 mb-4">
                      Asset Details
                    </Text>

                    <View className="gap-y-6">
                      <View className="flex-row items-center">
                        <View className="bg-[#f8fafc] p-2.5 rounded-xl mr-4 border border-slate-100">
                          <Laptop size={20} color="#64748b" />
                        </View>
                        <View>
                          <Text className="text-slate-400 text-xs font-['NotoSans_500Medium'] mb-0.5">Model</Text>
                          <Text className="text-slate-800 text-base font-['NotoSans_600SemiBold']">{scannedAsset.model.name}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        <View className="bg-[#f8fafc] p-2.5 rounded-xl mr-4 border border-slate-100">
                          <MapPin size={20} color="#64748b" />
                        </View>
                        <View>
                          <Text className="text-slate-400 text-xs font-['NotoSans_500Medium'] mb-0.5">Location</Text>
                          <Text className="text-slate-800 text-base font-['NotoSans_600SemiBold']">{scannedAsset.location?.name || 'Unknown'}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        <View className="bg-[#f8fafc] p-2.5 rounded-xl mr-4 border border-slate-100">
                          <User size={20} color="#64748b" />
                        </View>
                        <View>
                          <Text className="text-slate-400 text-xs font-['NotoSans_500Medium'] mb-0.5">Custodian</Text>
                          <Text className="text-slate-800 text-base font-['NotoSans_600SemiBold']">{scannedAsset.assignment?.assignedToUser?.name || '-'}</Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      className="bg-[#ef4444] rounded-xl py-4 items-center justify-center mt-8 active:opacity-90"
                      onPress={() => setShowReportForm(true)}
                    >
                      <Text className="text-white text-[16px] font-['NotoSans_700Bold']">Report An Issue</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View className="flex-row items-center mb-6">
                      <Pressable
                        onPress={() => setShowReportForm(false)}
                        className="mr-3 p-1"
                      >
                        <ChevronLeft size={24} color="#1e293b" />
                      </Pressable>
                      <Text className="text-xl font-['NotoSans_700Bold'] text-slate-900">
                        Report an Issue
                      </Text>
                    </View>

                    <Text className="text-slate-500 text-sm font-['NotoSans_500Medium'] mb-2">
                      {scannedAsset.asset.assetTag} · {scannedAsset.model.name}
                    </Text>

                    <TextInput
                      style={styles.issueTextArea}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      placeholder="Describe any issues, damages or missing parts..."
                      placeholderTextColor="#94a3b8"
                      value={issueNote}
                      onChangeText={setIssueNote}
                    />

                    <Pressable
                      className={`bg-[#ef4444] rounded-xl py-4 items-center justify-center mt-6 active:opacity-90 ${isSubmittingIssue || !issueNote.trim() ? 'opacity-50' : ''}`}
                      onPress={handleSubmitIssue}
                      disabled={isSubmittingIssue || !issueNote.trim()}
                    >
                      {isSubmittingIssue ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white text-[16px] font-['NotoSans_700Bold']">Submit Report</Text>
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
