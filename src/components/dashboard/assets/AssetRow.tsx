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
} from 'lucide-react-native';
import { Badge } from '../../ui/Badge';
import { Colors } from '../../../constants/colors';
import type { AssetEntry } from '../../../services/assets';
import type { ActivityEventType } from '../../../types';

interface AssetRowProps {
  asset: AssetEntry;
  onPress?: () => void;
}

const PILLAR_MAP: Record<
  string,
  { label: string; icon: React.ComponentType<any> }
> = {
  'IT & Digital': { label: 'Device', icon: Laptop },
  Software: { label: 'Software', icon: Code },
  'Office Furniture': { label: 'Furniture', icon: Armchair },
  'Office Electronics': { label: 'Electronics', icon: Speaker },
};

export function getAssetPresentation(pillar: string | undefined, modelName: string) {
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

/**
 * Individual asset row card for the My Assets screen.
 * Redesigned to exactly match the flat border style, typography,
 * and layout structure of the web app's asset card.
 */
export const AssetRow = React.memo(function AssetRow({ asset, onPress }: AssetRowProps) {
  const presentation = getAssetPresentation(asset.pillar, asset.name);
  const IconComponent = presentation.icon;
  const formattedDate = formatAssignedDate(asset.assignedDate);
  const displayCategory = asset.category || presentation.label;

  const returnInfo = getReturnStatus(asset.expectedReturnDate);
  const isOverdue = returnInfo.isOverdue;

  // Custom warning border/bg style if overdue
  const cardClassName = isOverdue
    ? 'bg-amber-50/50 border border-amber-200 p-5 rounded-2xl mb-3.5'
    : 'bg-white border border-slate-200/80 p-5 rounded-2xl mb-3.5';

  return (
    <Pressable
      className={cardClassName}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
      onPress={onPress}
    >
      {/* Header: Type and Status Badge */}
      <View className="flex-row items-center justify-between mb-3.5">
        <Text className="text-sm font-sans text-slate-500">
          {displayCategory}
        </Text>
        <Badge
          type={isOverdue ? 'lost' : (asset.status as ActivityEventType)}
          label={isOverdue ? 'Overdue' : undefined}
        />
      </View>

      {/* Middle: Icon and Name */}
      <View className="flex-row items-center gap-3 mb-3.5">
        <IconComponent size={26} color="#475569" strokeWidth={1.5} />
        <Text className="text-lg font-sansBold text-slate-900 flex-1" numberOfLines={1}>
          {asset.name}
        </Text>
      </View>

      {/* Bottom: Metadata Lines */}
      <View className="gap-1">
        <Text className="text-[13px] font-sans text-slate-500 leading-5">
          Asset ID: {asset.tagId}
        </Text>
        <Text className="text-[13px] font-sans text-slate-500 leading-5">
          Assigned: {formattedDate ?? '-'}
        </Text>
        {returnInfo.label && asset.expectedReturnDate && (
          <Text className={`text-[13px] leading-5 ${isOverdue ? 'text-rose-600 font-sansBold' : 'text-amber-600 font-sansBold'}`}>
            {returnInfo.label}
          </Text>
        )}
      </View>
    </Pressable>
  );
});
