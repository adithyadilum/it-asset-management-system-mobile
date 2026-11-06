import { logger } from '../lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans/400Regular';
import { NotoSans_500Medium } from '@expo-google-fonts/noto-sans/500Medium';
import { NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans/600SemiBold';
import { NotoSans_700Bold } from '@expo-google-fonts/noto-sans/700Bold';
import { AuthContext } from '../context/auth-context';
import { NotificationsProvider } from '../context/notifications-context';
import { isStoredTokenUsable } from '../lib/jwt';
import {
  clearStoredToken,
  getStoredToken,
  setUnauthenticatedHandler,
  type SessionEndReason,
} from '../constants/api';

import { watchDeviceSession } from '../services/device-session';

// Prevent the splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });
  const fontsReady = loaded || Boolean(error);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const authenticate = useCallback((value: boolean) => {
    if (value) setSessionNotice(null);
    setIsAuthenticated(value);
  }, []);

  // Validates the stored token's role *and* expiry, evicting anything stale.
  const checkAuth = useCallback(
    () =>
      getStoredToken()
        .then(async (key) => {
          const usable = isStoredTokenUsable(key);
          if (!usable && key) await clearStoredToken();
          setIsAuthenticated(usable);
        })
        .catch((error) => {
          logger.error('Error reading from SecureStore', error);
          setIsAuthenticated(false);
        })
        .finally(() => setAuthLoading(false)),
    []
  );
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    setSessionNotice(null);
    setIsAuthenticated(false);
    try {
      await clearStoredToken();
    } catch {
      logger.warn('Could not remove credentials from secure storage.');
    }
  }, []);
  useEffect(() => {
    setUnauthenticatedHandler((reason: SessionEndReason) => {
      setSessionNotice(
        (previous) =>
          previous ??
          (reason === 'unlinked'
            ? 'This device was unlinked from the web app. Pair it again to continue.'
            : 'Your device session has ended. Pair this device again to continue.')
      );
      setIsAuthenticated(false);
    });
    return () => setUnauthenticatedHandler(null);
  }, []);
  useEffect(() => {
    if (isAuthenticated) return watchDeviceSession();
  }, [isAuthenticated]);
  useEffect(() => {
    if (!isAuthLoading && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [isAuthLoading, fontsReady]);
  const isReady = fontsReady && !isAuthLoading;
  if (!isReady) {
    return (
      <View style={nativeStyles.panel}>
        <Image
          source={require('../../assets/icon.png')}
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
          }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <AuthContext.Provider
      value={{
        setIsAuthenticated: authenticate,
        sessionNotice,
        signOut,
      }}
    >
      <NotificationsProvider key={isAuthenticated ? 'linked' : 'unlinked'}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(dashboard)" />
            <Stack.Screen name="asset/[assetId]" />
            <Stack.Screen name="operations/select-asset" />
            <Stack.Screen name="operations/handover" />
            <Stack.Screen name="operations/return" />
          </Stack.Protected>
        </Stack>
      </NotificationsProvider>
    </AuthContext.Provider>
  );
}
const nativeStyles = StyleSheet.create({
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    rowGap: 32,
  },
});
