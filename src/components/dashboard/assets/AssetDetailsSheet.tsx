import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Badge } from '../../ui/Badge';
import { getAssetPresentation, getReturnStatus } from './AssetRow';
import type { AssetEntry } from '../../../services/assets';
import type { ActivityEventType } from '../../../types';

interface AssetDetailsSheetProps {
  asset: AssetEntry | null;
  visible: boolean;
  onClose: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return 'Open-ended';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Open-ended';
  }
}

/**
 * Slide-up details panel for an assigned asset.
 * Layout and typography are 100% consistent with the Accept Asset flow.
 */
export function AssetDetailsSheet({
  asset,
  visible,
  onClose,
}: AssetDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!asset) return;

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

  if (!asset) return null;

  const presentation = getAssetPresentation(asset.pillar, asset.name);
  const IconComponent = presentation.icon;
  const returnInfo = getReturnStatus(asset.expectedReturnDate);

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

      {/* Sheet */}
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
            Asset Details
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
                {asset.name}
              </Text>
            </View>

            {/* Key-Value details */}
            <View className="gap-2.5">
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Asset ID:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{asset.tagId}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Status:</Text>
                <View className="flex-1 items-start">
                  <Badge
                    type={returnInfo.isOverdue ? 'lost' : (asset.status as ActivityEventType)}
                    label={returnInfo.isOverdue ? 'Overdue' : undefined}
                  />
                </View>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Condition:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{asset.condition ?? 'Good'}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Assigned By:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{asset.assignedByName ?? 'IT Operations'}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Assigned On:</Text>
                <Text className="flex-1 text-sm font-sans text-slate-800">{formatDate(asset.assignedDate)}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="w-28 text-sm font-sans text-slate-500">Return By:</Text>
                <Text
                  className={`flex-1 text-sm font-sans ${
                    returnInfo.isOverdue ? 'text-rose-600 font-sansBold' : 'text-slate-800'
                  }`}
                >
                  {asset.expectedReturnDate ? formatDate(asset.expectedReturnDate) : 'Open-ended'}
                </Text>
              </View>
              {asset.expectedReturnDate && (
                <View className="flex-row items-center">
                  <Text className="w-28 text-sm font-sans text-slate-500">Time Left:</Text>
                  <Text
                    className={`flex-1 text-sm font-sansBold ${
                      returnInfo.isOverdue ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    {returnInfo.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Help / Policy disclaimer ── */}
          <Text className="text-sm font-sans text-slate-500 leading-relaxed mt-1">
            If this device requires support, repairs, or has been lost, please tap the Report Issue button to raise a support ticket.
          </Text>

          {/* ── Action buttons ── */}
          <View className="mt-4 pb-2">
            {/* Report Issue — outline */}
            <Pressable
              className="w-full bg-white border border-slate-200 py-3.5 rounded-xl items-center justify-center"
              style={({ pressed }) => pressed && { opacity: 0.7 }}
              onPress={onClose}
            >
              <Text className="text-slate-800 text-sm font-sansBold text-center">
                Report Issue
              </Text>
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
