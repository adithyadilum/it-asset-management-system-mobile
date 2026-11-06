import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetImage } from '../../inventory/AssetImage';
import { Colors } from '../../../constants/colors';
import { formatProfileDate } from '../../../lib/asset-profile';
import type { SoftwareAssetEntry } from '../../../services/assets';

export function softwareExpiry(asset: SoftwareAssetEntry) {
  if (asset.licenseType === 'Perpetual' && !asset.expiryDate)
    return { label: 'Perpetual licence', expired: false };
  if (!asset.expiryDate) return { label: 'No expiry recorded', expired: false };
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const expired = asset.expiryDate < today;
  return {
    label: `${expired ? 'Expired' : 'Expires'} ${formatProfileDate(asset.expiryDate)}`,
    expired,
  };
}
/** A software seat has no equipment acceptance, return or repair actions. */
export function SoftwareAssetRow({ asset }: { asset: SoftwareAssetEntry }) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const expiry = softwareExpiry(asset);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View software ${asset.name}`}
        onPress={() => setVisible(true)}
        style={styles.row}
        android_ripple={{ color: Colors.muted }}
      >
        <AssetImage uri={asset.imageUrl} />
        <View style={styles.summary}>
          <Text numberOfLines={1} style={styles.meta}>
            {asset.tagId || asset.category}
            {' \u00b7 '}
            {asset.licenseType}
          </Text>
          <Text numberOfLines={1} style={styles.name}>
            {asset.name}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.meta,
              expiry.expired && { color: Colors.destructive },
            ]}
          >
            {expiry.label}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.tabInactive} />
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss software details"
            onPress={() => setVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.heading}>Software access</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close software details"
                onPress={() => setVisible(false)}
                style={styles.close}
              >
                <X size={22} color={Colors.foreground} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 12 }}>
              <View style={styles.identity}>
                <AssetImage uri={asset.imageUrl} />
                <View style={styles.summary}>
                  <Text style={styles.name}>{asset.name}</Text>
                  <Text style={styles.meta}>
                    {asset.brand}
                    {' \u00b7 '}
                    {asset.category}
                  </Text>
                </View>
              </View>
              {[
                ['Asset ID', asset.tagId || 'Not linked to an asset'],
                ['Licence type', asset.licenseType],
                ['Your allocation', '1 seat'],
                ['Allocated', formatProfileDate(asset.allocatedDate)],
                ['Expiry', expiry.label],
              ].map(([label, value]) => (
                <View key={label} style={styles.fact}>
                  <Text style={styles.factLabel}>{label}</Text>
                  <Text style={styles.factValue}>{value}</Text>
                </View>
              ))}
              <Text style={styles.note}>
                Contact your IT team if you need help accessing this software.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  summary: { flex: 1, minWidth: 0, gap: 4 },
  name: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: Colors.foreground,
  },
  meta: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    lineHeight: 17,
    color: Colors.mutedForeground,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.card,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heading: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 18,
    color: Colors.foreground,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  factLabel: { fontSize: 12, color: Colors.mutedForeground, flex: 1 },
  factValue: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: Colors.foreground,
    flex: 1,
    textAlign: 'right',
  },
  note: { fontSize: 12, lineHeight: 19, color: Colors.mutedForeground },
});
