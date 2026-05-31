import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      {/* Uses NotoSans_700Bold */}
      <Text className="text-3xl font-sansBold text-primary">
        Scanner Ready
      </Text>

      {/* Uses NotoSans_400Regular */}
      <Text className="text-lg font-sans text-muted-foreground mt-2">
        Please link your device to continue.npx expo start -c
      </Text>
    </View>
  );
}