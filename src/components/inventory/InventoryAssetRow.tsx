import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import type { InventoryAsset } from '../../types/inventory';
import { AssetImage } from './AssetImage';
import { AssetStatus } from './AssetStatus';

export const InventoryAssetRow = memo(function InventoryAssetRow({
  asset,
  onOpen,
}: {
  asset: InventoryAsset;
  onOpen: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${asset.assetTag}, ${asset.name || asset.model}`}
      onPress={() => onOpen(asset.id)}
      style={styles.row}
      android_ripple={{ color: Colors.muted }}
    >
      <AssetImage uri={asset.imageUrl} />
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',

            gap: 6,
          }}
        >
          <Text style={[styles.tag, { flexShrink: 1 }]} numberOfLines={1}>
            {asset.assetTag}
          </Text>
          <AssetStatus status={asset.status} />
        </View>
        <Text style={styles.assetName} numberOfLines={1}>
          {asset.name || `${asset.brand} ${asset.model}`}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {asset.category}
          {asset.assignedTo ? ` \u00b7 ${asset.assignedTo}` : ''}
        </Text>
        {asset.location ? (
          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              alignItems: 'center',
            }}
          >
            <MapPin size={11} color={Colors.mutedForeground} />
            <Text style={[styles.meta, { flex: 1 }]} numberOfLines={1}>
              {asset.location}
            </Text>
          </View>
        ) : null}
      </View>
      <ChevronRight size={16} color={Colors.tabInactive} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
  },
  tag: { fontFamily: 'NotoSans_700Bold', color: Colors.primary, fontSize: 11 },
  assetName: {
    fontFamily: 'NotoSans_600SemiBold',
    color: Colors.foreground,
    fontSize: 14,
  },
  meta: {
    fontFamily: 'NotoSans_400Regular',
    color: Colors.mutedForeground,
    fontSize: 11,
    flexShrink: 1,
  },
});
