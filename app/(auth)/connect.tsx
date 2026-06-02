import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../auth-context';

export default function ConnectScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setIsAuthenticated } = useAuth();

  const handleScan = async ({ data }: { data: string }) => {
    // Prevent duplicate scans
    if (isLoading || !isScanning) return;
    
    setIsLoading(true);
    // Pause scanning visually by keeping the camera open but ignoring new scans via isLoading
    
    try {
      // 1. Gather device metadata
      const deviceName = Device.modelName || 'Unknown Device';
      const deviceOs = `${Device.osName} ${Device.osVersion}`;
      const deviceModel = Device.designName || Device.modelName || 'Unknown Model';

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      // 2. Exchange token
      const response = await fetch(`${API_URL}/api/auth/mobile-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: data,
          deviceName,
          deviceOs,
          deviceModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Exchange failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.token) {
        // 3. Store JWT
        await SecureStore.setItemAsync('secure_admin_api_key', result.token);
        
        // 4. Update auth context (redirects to dashboard)
        setIsAuthenticated(true);
      } else {
        throw new Error('No token received from server.');
      }
    } catch (error: any) {
      console.error('Scan Error:', error);
      Alert.alert(
        'Pairing Failed',
        error.message || 'The QR code was invalid or expired. Please try again.',
        [{ text: 'OK', onPress: () => {
          setIsScanning(false);
          setIsLoading(false);
        }}]
      );
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan the QR code.');
        return;
      }
    }
    setIsScanning(true);
  };

  if (isScanning) {
    return (
      <View className="flex-1 bg-black">
        <CameraView 
          style={StyleSheet.absoluteFillObject} 
          facing="back"
          onBarcodeScanned={isLoading ? undefined : handleScan}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        
        {/* Overlay */}
        <SafeAreaView className="flex-1 justify-between p-6">
          <View className="items-center mt-8">
            <Text className="text-white text-lg font-sansBold">Scan QR Code</Text>
            <Text className="text-white/80 text-sm font-sans mt-2 text-center">
              Point your camera at the QR code on your computer screen.
            </Text>
          </View>
          
          <View className="flex-1 items-center justify-center">
            {/* Scanner box cutout simulation */}
            <View className="w-64 h-64 border-2 border-white/50 rounded-xl bg-transparent" />
          </View>

          <View className="items-center mb-8">
            {isLoading ? (
              <View className="bg-white/20 p-4 rounded-full flex-row items-center">
                <ActivityIndicator color="#ffffff" className="mr-3" />
                <Text className="text-white font-sansBold">Verifying...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                className="bg-white/20 px-8 py-4 rounded-full"
                onPress={() => setIsScanning(false)}
              >
                <Text className="text-white font-sansBold text-base">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Welcome Screen UI
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        
        {/* Logo Container */}
        <View className="mb-12 items-center">
          <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-border">
            <Image 
              source={require('../../assets/tiqri-logo.png')} 
              style={{ width: 140, height: 48 }}
              resizeMode="contain"
            />
          </View>
          
          <Text className="text-3xl font-sansBold text-foreground tracking-tight text-center">
            Device Pairing
          </Text>
          <Text className="text-base font-sans text-muted-foreground text-center mt-3">
            Securely link your mobile device to your TIQRI IT Asset Management dashboard.
          </Text>
        </View>

        {/* Primary Action */}
        <TouchableOpacity 
          className="bg-primary w-full py-4 rounded-full flex-row items-center justify-center shadow-sm active:scale-95 transition-transform"
          onPress={startScanning}
        >
          <Text className="text-primary-foreground font-sansBold text-lg">
            Scan to Login
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}