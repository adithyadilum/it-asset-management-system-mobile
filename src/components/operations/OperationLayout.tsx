import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { Colors } from '../../constants/colors';
import type { AssetProfile } from '../../types/inventory';
import { AssetImage } from '../inventory/AssetImage';
import { Button } from '../ui/Button';
export function OperationLayout({
  title,
  busy = false,
  children,
}: {
  title: string;
  busy?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets(),
    router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.backgroundSubtle,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={operationStyles.header}>
        <Pressable
          disabled={busy}
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(dashboard)/inventory')
          }
          style={{ width: 40, height: 40, justifyContent: 'center' }}
        >
          <ArrowLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text style={operationStyles.title}>{title}</Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}
export function OperationAsset({ profile }: { profile: AssetProfile }) {
  return (
    <View
      style={[
        operationStyles.card,
        { flexDirection: 'row', gap: 12, alignItems: 'center' },
      ]}
    >
      <AssetImage uri={profile.model.imageUrl} />
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Text style={operationStyles.label}>{profile.asset.assetTag}</Text>
        <Text style={operationStyles.title}>
          {profile.asset.name || profile.model.name}
        </Text>
        <Text style={operationStyles.note}>
          {profile.model.brand.name}
          {' \u00b7 '}
          {profile.asset.status}
        </Text>
      </View>
    </View>
  );
}
export function Field({
  label,
  ...props
}: ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={operationStyles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={Colors.mutedForeground}
        style={[
          operationStyles.input,
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Choice({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        operationStyles.choice,
        selected && {
          borderColor: Colors.primary,
          backgroundColor: Colors.primary,
        },
      ]}
    >
      <Text
        style={[
          operationStyles.choiceText,
          selected && { color: Colors.primaryForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function OperationSuccess({
  message,
  assetId,
}: {
  message: string;
  assetId: string;
}) {
  const router = useRouter();
  return (
    <View
      style={[
        operationStyles.card,
        { alignItems: 'center', gap: 16, paddingVertical: 28 },
      ]}
    >
      <CheckCircle2 size={36} color={Colors.success} />
      <Text style={[operationStyles.title, { textAlign: 'center' }]}>
        {message}
      </Text>
      <Button
        onPress={() =>
          router.replace({ pathname: '/asset/[assetId]', params: { assetId } })
        }
      >
        View asset
      </Button>
    </View>
  );
}
export const operationStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 17,
    color: Colors.foreground,
  },
  label: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
  note: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
    color: Colors.foreground,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    backgroundColor: Colors.card,
  },
  choice: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  choiceText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: Colors.foreground,
  },
  error: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.destructive,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
