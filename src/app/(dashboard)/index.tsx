import { Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-3xl font-sansBold text-primary">
        Dashboard
      </Text>
      <Text className="text-lg font-sans text-muted-foreground mt-2">
        Welcome to the mock dashboard.
      </Text>
    </View>
  );
}