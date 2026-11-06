import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  HardDrive,
  Laptop,
  Monitor,
  Smartphone,
  Code,
  Armchair,
  Speaker,
  Printer,
  Server,
  Tablet,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { AssetImage } from '../../inventory/AssetImage';
import type { AssetEntry } from '../../../services/assets';

interface AssetRowProps {
  asset: AssetEntry;
  onPress?: () => void;
}

const PILLAR_MAP: Record<
  string,
  { label: string; icon: React.ComponentType<any> }
> = {
  Hardware: { label: 'Device', icon: Laptop },
  'IT & Digital': { label: 'Device', icon: Laptop },
  Software: { label: 'Software', icon: Code },
  'Office Furniture': { label: 'Furniture', icon: Armchair },
  'Office Electronics': { label: 'Electronics', icon: Speaker },
};

export function getAssetPresentation(
  pillar: string | undefined,
  modelName: string
) {
  if (pillar && PILLAR_MAP[pillar]) {
    return PILLAR_MAP[pillar];
  }

  // Fallback: model name heuristic for legacy data
  const normalized = (modelName ?? '').trim().toLowerCase();
  if (
    normalized.includes('macbook') ||
    normalized.includes('laptop') ||
    normalized.includes('thinkpad') ||
    normalized.includes('computer')
  ) {
    return { label: 'Laptop', icon: Laptop };
  }
  if (
    normalized.includes('iphone') ||
    normalized.includes('phone') ||
    normalized.includes('mobile')
  ) {
    return { label: 'Phone', icon: Smartphone };
  }
  if (normalized.includes('monitor') || normalized.includes('display')) {
    return { label: 'Monitor', icon: Monitor };
  }
  if (normalized.includes('printer')) {
    return { label: 'Printer', icon: Printer };
  }
  if (normalized.includes('server')) {
    return { label: 'Server', icon: Server };
  }
  if (normalized.includes('tablet') || normalized.includes('ipad')) {
    return { label: 'Tablet', icon: Tablet };
  }
  return { label: 'Asset', icon: HardDrive };
}

/**
 * Calculates days left and overdue status for an expected return date.
 */
export function getReturnStatus(expectedReturnDateStr?: string) {
  if (!expectedReturnDateStr) {
    return { label: 'Open-ended', isOverdue: false, daysDiff: 0 };
  }

  try {
    const returnDate = new Date(expectedReturnDateStr);
    if (isNaN(returnDate.getTime())) {
      return { label: 'Open-ended', isOverdue: false, daysDiff: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    returnDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const timeDiff = returnDate.getTime() - today.getTime();
    const daysDiff = Math.round(timeDiff / msPerDay);

    if (daysDiff < 0) {
      const positiveDays = Math.abs(daysDiff);
      return {
        label: `Overdue by ${positiveDays} day${positiveDays !== 1 ? 's' : ''}`,
        isOverdue: true,
        daysDiff,
      };
    } else if (daysDiff === 0) {
      return {
        label: 'Due today',
        isOverdue: false,
        daysDiff,
      };
    } else {
      return {
        label: `${daysDiff} day${daysDiff !== 1 ? 's' : ''} remaining`,
        isOverdue: false,
        daysDiff,
      };
    }
  } catch {
    return { label: 'Open-ended', isOverdue: false, daysDiff: 0 };
  }
}

function formatAssignedDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/** Compact custody summary; full details are available on tap. */
export const AssetRow = React.memo(function AssetRow({
  asset,
  onPress,
}: AssetRowProps) {
  const returnInfo = getReturnStatus(asset.expectedReturnDate);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${asset.name}, ${asset.tagId}`}
      android_ripple={{ color: Colors.muted }}
      style={{
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
      }}
    >
      <AssetImage uri={asset.imageUrl ?? null} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'NotoSans_600SemiBold',
            fontSize: 11,
            color: Colors.primary,
          }}
        >
          {asset.tagId}
          {' \u00b7 '}
          {asset.category ||
            getAssetPresentation(asset.pillar, asset.name).label}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'NotoSans_600SemiBold',
            fontSize: 14,
            color: Colors.foreground,
          }}
        >
          {asset.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            color: returnInfo.isOverdue
              ? Colors.destructive
              : Colors.mutedForeground,
          }}
        >
          {asset.expectedReturnDate
            ? returnInfo.label
            : `Assigned ${formatAssignedDate(asset.assignedDate) || ''}`.trim()}
        </Text>
      </View>
      <ChevronRight size={16} color={Colors.tabInactive} />
    </Pressable>
  );
});
