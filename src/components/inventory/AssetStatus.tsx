import { Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
export function AssetStatus({ status }: { status: string }) {
  const value = status.toLowerCase();
  const color =
    value === 'available'
      ? Colors.success
      : ['warning', 'lost', 'expired'].includes(value)
        ? Colors.warning
        : value.includes('repair')
          ? Colors.status.repair
          : Colors.primary;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
      }}
    >
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
      />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'NotoSans_600SemiBold',
          fontSize: 11,
          color,
          flexShrink: 1,
          textTransform: 'capitalize',
        }}
      >
        {status}
      </Text>
    </View>
  );
}
