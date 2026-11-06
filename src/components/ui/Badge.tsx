import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
} from 'lucide-react-native';
interface BadgeProps {
  type: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}
const variants = {
  assigned: {
    label: 'Assigned',
    icon: CheckCircle2,
    color: '#475569',
    background: '#F8FAFC',
    border: '#CBD5E1',
  },
  lost: {
    label: 'Lost',
    icon: AlertCircle,
    color: '#B45309',
    background: '#FFFBEB',
    border: '#FCD34D',
  },
  repair: {
    label: 'In Repair',
    icon: Wrench,
    color: '#7C3AED',
    background: '#FAF5FF',
    border: '#D8B4FE',
  },
  disposed: {
    label: 'Disposed',
    icon: CheckCircle2,
    color: '#64748B',
    background: '#F1F5F9',
    border: '#CBD5E1',
  },
  new: {
    label: 'New',
    icon: Sparkles,
    color: '#2563EB',
    background: '#EFF6FF',
    border: '#93C5FD',
  },
};
export function Badge({ type, label, style }: BadgeProps) {
  const config = variants[type as keyof typeof variants] || {
    ...variants.assigned,
    label: type.replace(/_/g, ' '),
  };
  const Icon = config.icon;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.background, borderColor: config.border },
        style,
      ]}
    >
      <Icon size={12} color={config.color} strokeWidth={2} />
      <Text numberOfLines={1} style={[styles.text, { color: config.color }]}>
        {label || config.label}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontFamily: 'NotoSans_400Regular', fontSize: 11, flexShrink: 1 },
});
