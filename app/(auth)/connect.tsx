import { Text, View } from 'react-native';

export default function ConnectScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-3xl font-sansBold text-primary">
        Connect Device
      </Text>
      <Text className="text-lg font-sans text-muted-foreground mt-2">
        Please link your device to continue.
      </Text>
    </View>
  );
}