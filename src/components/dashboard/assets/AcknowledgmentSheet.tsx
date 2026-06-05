import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  AlertTriangle,
  Check,
} from 'lucide-react-native';
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
 * Layout and styling uses global.css tokens via className throughout.
 */
export function AcknowledgmentSheet({
  assignment,
  visible,
  onClose,
  onConfirm,
}: AcknowledgmentSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && assignment) {
      setAcknowledged(false);
      setConfirmError(null);
      setConfirming(false);
    }
  }, [visible, assignment?.assignmentId]);

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
  }, [visible]);

  const handleConfirm = async () => {
    if (!assignment || !acknowledged || confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await onConfirm(assignment.assignmentId);
      onClose();
    } catch (err: any) {
      setConfirmError(err.message ?? 'Failed to confirm. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const presentation = getAssetPresentation(assignment?.pillar, assignment?.name ?? '');
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
        style={[sheet.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet — platform shadow only via StyleSheet, rest via className */}
      <Animated.View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
        style={[
          sheet.shadow,
          { paddingBottom: insets.bottom + 20 },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View className="self-center w-9 h-1 bg-slate-200 rounded-full mt-2.5 mb-1" />

        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3">
          <Text className="text-[17px] font-sansBold text-slate-800">
            Accept Asset Assignment
          </Text>
          <Pressable
            className="p-1"
            style={({ pressed }) => pressed && { opacity: 0.5 }}
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <X size={18} color="#475569" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 14 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Asset identity & details block ── */}
          <View className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 mb-1">
            {/* Icon and Name */}
            <View className="flex-row items-center gap-3.5 mb-4">
              <IconComponent size={32} color="#0A1A8A" strokeWidth={1.5} />
              <Text className="text-[19px] font-sansBold text-slate-900 flex-1" numberOfLines={1}>
                {assignment?.name ?? '—'}
              </Text>
            </View>

            {/* Key-Value details */}
            <View className="gap-2.5">
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Asset ID:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{assignment?.tagId ?? '—'}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Condition:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{assignment?.condition ?? 'Unknown'}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Assigned By:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{assignment?.assignedByName ?? '—'}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Date:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{formatDate(assignment?.assignedDate)}</Text>
              </View>
            </View>
          </View>

          {/* ── Policy disclaimer ── */}
          <Text className="text-sm font-sans text-slate-500 leading-relaxed mt-1">
            By accepting this equipment, you acknowledge that you have received it in the condition stated above and agree to abide by the TIQRI IT Acceptable Use Policy.
          </Text>

          {/* ── Acknowledgment checkbox ── */}
          <Pressable
            className="flex-row items-start gap-3 mt-3 py-1"
            style={({ pressed }) => pressed && { opacity: 0.8 }}
            onPress={() => setAcknowledged((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
          >
            <View
              className={`w-5 h-5 rounded-md border items-center justify-center mt-0.5 ${
                acknowledged
                  ? 'border-slate-800 bg-slate-800'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {acknowledged && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
            </View>
            <Text className="flex-1 text-[13px] font-sansBold text-slate-800 leading-5">
              I acknowledge and accept responsibility for this asset.
            </Text>
          </Pressable>

          {/* ── Error message ── */}
          {confirmError && (
            <View className="flex-row items-center gap-1.5 bg-destructive/10 rounded-lg px-3 py-2.5 mt-1">
              <AlertTriangle size={13} color={Colors.destructive} strokeWidth={2} />
              <Text className="flex-1 text-xs text-destructive leading-[17px]">
                {confirmError}
              </Text>
            </View>
          )}

          {/* ── Action buttons ── */}
          <View className="flex-row items-center gap-3 mt-4">
            {/* Report Issue — outline */}
            {/* TODO: Implement report issue routing instead of just closing the sheet */}
            <Pressable
              className="flex-1 bg-white border border-slate-200 py-3 rounded-xl items-center justify-center"
              style={({ pressed }) => pressed && { opacity: 0.7 }}
              onPress={onClose}
            >
              <Text className="text-slate-800 text-sm font-sansBold text-center px-1">
                Report Issue
              </Text>
            </Pressable>

            {/* Confirm Receipt — solid */}
            <Pressable
              className={`flex-1 py-3 rounded-xl items-center justify-center ${
                acknowledged && !confirming ? 'bg-[#707FA5]' : 'bg-[#707FA5]/40'
              }`}
              disabled={!acknowledged || confirming}
              style={({ pressed }) => pressed && acknowledged && !confirming && { opacity: 0.8 }}
              onPress={handleConfirm}
            >
              <View className="flex-row items-center justify-center gap-1.5">
                {confirming && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text className="text-white text-sm font-sansBold text-center">
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shadow: {
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 20 },
    }),
  },
});
