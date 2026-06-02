import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import {
    useFonts,
    NotoSans_400Regular,
    NotoSans_700Bold
} from '@expo-google-fonts/noto-sans';
import { AuthContext } from './auth-context';
import "../../global.css"; // Move your global CSS import here!

// Prevent the splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        NotoSans_400Regular,
        NotoSans_700Bold,
    });

    const [isAuthLoading, setAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            try {
                const key = await SecureStore.getItemAsync('secure_admin_api_key');
                setIsAuthenticated(!!key);
            } catch (e) {
                console.error('Error reading from SecureStore', e);
                setIsAuthenticated(false);
            } finally {
                setAuthLoading(false);
            }
        }
        checkAuth();
    }, []);

    useEffect(() => {
        if (!isAuthLoading && loaded) {
            SplashScreen.hideAsync();
        }
    }, [isAuthLoading, loaded]);

    useEffect(() => {
        if (isAuthLoading || !loaded) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to the sign-in page.
            router.replace('/(auth)/connect');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(dashboard)');
        }
    }, [isAuthenticated, isAuthLoading, loaded, segments]);

    const isReady = loaded && !isAuthLoading;

    if (!isReady) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ setIsAuthenticated }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            </Stack>
        </AuthContext.Provider>
    );
}