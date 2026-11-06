import { toMessage } from '../../../lib/errors';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  useAnimatedValue,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, AlertTriangle, Check } from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { getAssetPresentation } from './AssetRow';
import type { PendingAssignment } from '../../../services/assets';
interface AcknowledgmentSheetProps {
  assignment: PendingAssignment | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (assignmentId: number) => Promise<void>;
}
function formatDate(iso?: string): string {
  if (!iso) return 'Not specified';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Not specified';
  }
}

/**
 * AcknowledgmentSheet — minimalist bottom sheet matching the web app modal design.
 *
 * Custom Modal + Animated for slide-in/out (Expo Go compatible, no native deps).
 * Uses native styles and the shared app palette.
 */
export function AcknowledgmentSheet({
  assignment,
  visible,
  onClose,
  onConfirm,
}: AcknowledgmentSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useAnimatedValue(700);
  const backdropAnim = useAnimatedValue(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 240,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 700,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);
  const handleConfirm = async () => {
    if (!assignment || !acknowledged || confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await onConfirm(assignment.assignmentId);
      onClose();
    } catch (err) {
      setConfirmError(toMessage(err, 'Failed to confirm. Please try again.'));
    } finally {
      setConfirming(false);
    }
  };
  const presentation = getAssetPresentation(
    assignment?.pillar,
    assignment?.name ?? ''
  );
  const IconComponent = presentation.icon;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          sheet.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Native bottom sheet */}
      <Animated.View
        style={[
          nativeStyles.panel,
          [
            sheet.shadow,
            {
              paddingBottom: insets.bottom + 20,
            },
            {
              transform: [
                {
                  translateY: slideAnim,
                },
              ],
            },
          ],
        ]}
      >
        {/* Drag handle */}
        <View style={nativeStyles.panel2} />

        {/* ── Header ── */}
        <View style={nativeStyles.row}>
          <Text style={nativeStyles.title}>Accept Asset Assignment</Text>
          <Pressable
            style={({ pressed }) => [
              nativeStyles.padded,
              pressed && {
                opacity: 0.5,
              },
            ]}
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <X size={18} color="#475569" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 8,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={nativeStyles.container}
        >
          {/* ── Asset identity & details block ── */}
          <View style={nativeStyles.panel3}>
            {/* Icon and Name */}
            <View style={nativeStyles.row2}>
              <IconComponent size={32} color="#0A1A8A" strokeWidth={1.5} />
              <Text numberOfLines={1} style={nativeStyles.title2}>
                {assignment?.name ?? '—'}
              </Text>
            </View>

            {/* Key-Value details */}
            <View style={nativeStyles.container2}>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Asset ID:</Text>
                <Text style={nativeStyles.text2}>
                  {assignment?.tagId ?? '—'}
                </Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Condition:</Text>
                <Text style={nativeStyles.text2}>
                  {assignment?.condition ?? 'Unknown'}
                </Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Assigned By:</Text>
                <Text style={nativeStyles.text2}>
                  {assignment?.assignedByName ?? '—'}
                </Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Date:</Text>
                <Text style={nativeStyles.text2}>
                  {formatDate(assignment?.assignedDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Policy disclaimer ── */}
          <Text style={nativeStyles.text3}>
            By accepting this equipment, you acknowledge that you have received
            it in the condition stated above and agree to abide by the TIQRI IT
            Acceptable Use Policy.
          </Text>

          {/* ── Acknowledgment checkbox ── */}
          <Pressable
            style={({ pressed }) => [
              nativeStyles.row4,
              pressed && {
                opacity: 0.8,
              },
            ]}
            onPress={() => setAcknowledged((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: acknowledged,
            }}
          >
            <View
              style={[
                nativeStyles.container3,
                acknowledged ? nativeStyles.panel4 : nativeStyles.panel5,
              ]}
            >
              {acknowledged && (
                <Check size={12} color="#FFFFFF" strokeWidth={3.5} />
              )}
            </View>
            <Text style={nativeStyles.text4}>
              I acknowledge and accept responsibility for this asset.
            </Text>
          </Pressable>

          {/* ── Error message ── */}
          {confirmError && (
            <View style={nativeStyles.row5}>
              <AlertTriangle
                size={13}
                color={Colors.destructive}
                strokeWidth={2}
              />
              <Text style={nativeStyles.text5}>{confirmError}</Text>
            </View>
          )}

          {/* ── Action buttons ── */}
          <View style={nativeStyles.row6}>
            {/* Cancel keeps the pending assignment unchanged. */}
            <Pressable
              style={({ pressed }) => [
                nativeStyles.panel6,
                pressed && {
                  opacity: 0.7,
                },
              ]}
              onPress={onClose}
            >
              <Text style={nativeStyles.text6}>Cancel</Text>
            </Pressable>

            {/* Confirm Receipt — solid */}
            <Pressable
              disabled={!acknowledged || confirming}
              style={({ pressed }) => [
                [
                  nativeStyles.container4,
                  acknowledged && !confirming
                    ? nativeStyles.panel7
                    : nativeStyles.panel8,
                ],
                pressed &&
                  acknowledged &&
                  !confirming && {
                    opacity: 0.8,
                  },
              ]}
              onPress={handleConfirm}
            >
              <View style={nativeStyles.row7}>
                {confirming && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text style={nativeStyles.text7}>
                  {confirming ? 'Confirming…' : 'Confirm Receipt'}
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
const sheet = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shadow: {
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
});
const nativeStyles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  panel2: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 9999,
    marginTop: 10,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: 'NotoSans_700Bold',
    color: '#1E293B',
  },
  padded: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  panel3: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 4,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  title2: {
    fontSize: 19,
    fontFamily: 'NotoSans_700Bold',
    color: '#0F172A',
    flex: 1,
  },
  container2: {
    gap: 10,
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    width: 112,
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
  },
  text2: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#1E293B',
  },
  text3: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    lineHeight: 22,
    marginTop: 4,
  },
  row4: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
    paddingVertical: 4,
  },
  container3: {
    width: 20,
    height: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  panel4: {
    borderColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  panel5: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  text4: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoSans_700Bold',
    color: '#1E293B',
    lineHeight: 20,
  },
  row5: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  text5: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 17,
  },
  row6: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  panel6: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text6: {
    color: '#1E293B',
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  container4: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel7: {
    backgroundColor: Colors.primary,
  },
  panel8: {
    backgroundColor: 'rgba(4, 13, 90, 0.4)',
  },
  row7: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text7: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    textAlign: 'center',
  },
});
