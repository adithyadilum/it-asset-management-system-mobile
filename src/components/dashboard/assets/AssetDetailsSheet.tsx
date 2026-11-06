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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { IssueReportForm } from './IssueReportForm';
import { Badge } from '../../ui/Badge';
import { getAssetPresentation, getReturnStatus } from './AssetRow';
import type { AssetEntry } from '../../../services/assets';
import type { ActivityEventType } from '../../../types';
interface AssetDetailsSheetProps {
  asset: AssetEntry | null;
  visible: boolean;
  onClose: () => void;
  onIssueReported?: () => void;
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
  onIssueReported,
}: AssetDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const [reporting, setReporting] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const close = () => {
    if (!reportBusy) onClose();
  };
  const slideAnim = useAnimatedValue(700);
  const backdropAnim = useAnimatedValue(0);
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
  }, [visible, asset, slideAnim, backdropAnim]);
  if (!asset) return null;
  const presentation = getAssetPresentation(asset.pillar, asset.name);
  const IconComponent = presentation.icon;
  const returnInfo = getReturnStatus(asset.expectedReturnDate);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
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
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sheet */}
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
          <Text style={nativeStyles.title}>Asset Details</Text>
          <Pressable
            style={({ pressed }) => [
              nativeStyles.padded,
              pressed && {
                opacity: 0.5,
              },
            ]}
            onPress={close}
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
                {asset.name}
              </Text>
            </View>

            {/* Key-Value details */}
            <View style={nativeStyles.container2}>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Asset ID:</Text>
                <Text style={nativeStyles.text2}>{asset.tagId}</Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Status:</Text>
                <View style={nativeStyles.container3}>
                  <Badge
                    type={
                      returnInfo.isOverdue
                        ? 'lost'
                        : (asset.status as ActivityEventType)
                    }
                    label={returnInfo.isOverdue ? 'Overdue' : asset.statusLabel}
                  />
                </View>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Condition:</Text>
                <Text style={nativeStyles.text2}>
                  {asset.condition ?? 'Not recorded'}
                </Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Assigned By:</Text>
                <Text style={nativeStyles.text2}>
                  {asset.assignedByName ?? 'Not recorded'}
                </Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Assigned On:</Text>
                <Text style={nativeStyles.text2}>
                  {formatDate(asset.assignedDate)}
                </Text>
              </View>
              <View style={nativeStyles.row3}>
                <Text style={nativeStyles.text}>Return By:</Text>
                <Text
                  style={[
                    nativeStyles.text3,
                    returnInfo.isOverdue
                      ? nativeStyles.container4
                      : nativeStyles.container5,
                  ]}
                >
                  {asset.expectedReturnDate
                    ? formatDate(asset.expectedReturnDate)
                    : 'Open-ended'}
                </Text>
              </View>
              {asset.expectedReturnDate && (
                <View style={nativeStyles.row3}>
                  <Text style={nativeStyles.text}>Time Left:</Text>
                  <Text
                    style={[
                      nativeStyles.text4,
                      returnInfo.isOverdue
                        ? nativeStyles.container6
                        : nativeStyles.container7,
                    ]}
                  >
                    {returnInfo.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {reporting ? (
            <IssueReportForm
              assetId={asset.id}
              assetTag={asset.tagId}
              onBusyChange={setReportBusy}
              onCancel={() => setReporting(false)}
              onSubmitted={() => {
                setReporting(false);
                onClose();
                onIssueReported?.();
              }}
            />
          ) : (
            <>
              {/* ── Help / Policy disclaimer ── */}
              <Text style={nativeStyles.text5}>
                If this device requires support, repairs, or has been lost,
                please tap the Report Issue button to raise a support ticket.
              </Text>

              {/* ── Action buttons ── */}
              <View style={nativeStyles.container8}>
                {/* Report Issue — outline */}
                <Pressable
                  style={({ pressed }) => [
                    nativeStyles.panel4,
                    pressed && {
                      opacity: 0.7,
                    },
                  ]}
                  onPress={() => setReporting(true)}
                >
                  <Text style={nativeStyles.text6}>Report Issue</Text>
                </Pressable>
              </View>
            </>
          )}
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
  container3: {
    flex: 1,
    alignItems: 'flex-start',
  },
  text3: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
  },
  container4: {
    color: '#E11D48',
    fontFamily: 'NotoSans_700Bold',
  },
  container5: {
    color: '#1E293B',
  },
  text4: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
  },
  container6: {
    color: '#E11D48',
  },
  container7: {
    color: '#D97706',
  },
  text5: {
    fontSize: 14,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    lineHeight: 22,
    marginTop: 4,
  },
  container8: {
    marginTop: 16,
    paddingBottom: 8,
  },
  panel4: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text6: {
    color: '#1E293B',
    fontSize: 14,
    fontFamily: 'NotoSans_700Bold',
    textAlign: 'center',
  },
});
