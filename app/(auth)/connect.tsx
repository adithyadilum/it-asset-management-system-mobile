import { Text, View, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ConnectScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-2xl font-sansBold text-primary text-center mb-4">
          Camera Required
        </Text>
        <Text className="text-base font-sans text-muted-foreground text-center mb-6">
          Please grant camera permission to scan your setup QR Code.
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
    </View>
  );
}