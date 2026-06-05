import React from 'react';
import { View, Text } from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
} from 'lucide-react-native';
import type { ActivityEventType } from '../../types';

interface BadgeProps {
  type: ActivityEventType;
  label?: string;
  className?: string;
}

const badgeConfig: Record<
  ActivityEventType,
  { label: string; icon: React.ComponentType<any>; bgClass: string; borderClass: string; textClass: string; iconColor: string }
> = {
  assigned: {
    label: 'Assigned',
    icon: CheckCircle2,
    bgClass: 'bg-slate-50/50',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-700',
    iconColor: '#475569',
  },
  lost: {
    label: 'Lost',
    icon: AlertCircle,
    bgClass: 'bg-amber-50/50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    iconColor: '#D97706',
  },
  repair: {
    label: 'In Repair',
    icon: Wrench,
    bgClass: 'bg-purple-50/50',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-700',
    iconColor: '#7C3AED',
  },
  disposed: {
    label: 'Disposed',
    icon: CheckCircle2,
    bgClass: 'bg-slate-100/50',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-600',
    iconColor: '#64748B',
  },
  new: {
    label: 'New',
    icon: Sparkles,
    bgClass: 'bg-blue-50/50',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-700',
    iconColor: '#2563EB',
  },
};

export function Badge({ type, label, className = '' }: BadgeProps) {
  const config = badgeConfig[type];
  if (!config) return null;
  const IconComponent = config.icon;

  return (
    <View
      className={`flex-row items-center px-2 py-0.5 rounded-full border ${config.bgClass} ${config.borderClass} ${className}`}
    >
      <IconComponent size={12} color={config.iconColor} strokeWidth={2} />
      <Text className={`text-xs font-sans ml-1.5 ${config.textClass}`}>
        {label || config.label}
      </Text>
    </View>
  );
}
