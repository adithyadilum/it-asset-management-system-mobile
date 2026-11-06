import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Button } from '../ui/Button';
import type {
  InventoryFilters,
  InventoryResponse,
} from '../../types/inventory';

export function InventoryFiltersSheet({
  visible,
  filters,
  options,
  onChange,
  onClose,
}: {
  visible: boolean;
  filters: InventoryFilters;
  options: InventoryResponse['filters'];
  onChange: (filters: InventoryFilters) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const group = (
    title: string,
    field: 'pillar' | 'categoryId' | 'locationId' | 'status',
    choices: { value: string | number; label: string }[]
  ) => (
    <View style={{ gap: 8, marginBottom: 22 }} key={field}>
      <Text
        style={{ fontFamily: 'NotoSans_700Bold', color: Colors.foreground }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[{ value: '', label: 'All' }, ...choices].map((choice) => {
          const selected = (filters[field] ?? '') === choice.value;
          return (
            <Pressable
              key={choice.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${title}: ${choice.label}`}
              onPress={() =>
                onChange({
                  ...filters,
                  [field]: choice.value === '' ? undefined : choice.value,
                  ...(field === 'pillar' ? { categoryId: undefined } : {}),
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: selected ? Colors.primary : Colors.border,
                backgroundColor: selected ? Colors.primary : Colors.card,
              }}
            >
              {selected && <Check size={13} color={Colors.primaryForeground} />}
              <Text
                style={{
                  fontFamily: 'NotoSans_500Medium',
                  fontSize: 12,
                  color: selected
                    ? Colors.primaryForeground
                    : Colors.foreground,
                }}
              >
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(15,23,42,0.4)',
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityLabel="Close filters"
        />
        <View
          style={{
            maxHeight: '85%',
            backgroundColor: Colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'NotoSans_700Bold',
                color: Colors.foreground,
              }}
            >
              Filter inventory
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close filters"
              hitSlop={12}
            >
              <X size={22} color={Colors.foreground} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator>
            {group(
              'Asset type',
              'pillar',
              [
                'Hardware',
                'Software',
                'Office Furniture',
                'Office Electronics',
              ].map((value) => ({ value, label: value }))
            )}
            {group(
              'Category',
              'categoryId',
              options.categories
                .filter(
                  (item) => !filters.pillar || item.pillar === filters.pillar
                )
                .map((item) => ({ value: item.id, label: item.name }))
            )}
            {group(
              'Status',
              'status',
              options.statuses.map((value) => ({
                value,
                label: value.charAt(0).toUpperCase() + value.slice(1),
              }))
            )}
            {group(
              'Location',
              'locationId',
              options.locations.map((item) => ({
                value: item.id,
                label: item.name,
              }))
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 12, paddingTop: 12 }}>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => onChange({})}
            >
              Reset filters
            </Button>
            <Button style={{ flex: 1 }} onPress={onClose}>
              Show results
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
