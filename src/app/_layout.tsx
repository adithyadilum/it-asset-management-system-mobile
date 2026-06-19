import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
    useFonts,
    NotoSans_400Regular,
    NotoSans_700Bold
} from '@expo-google-fonts/noto-sans';
import Pusher from 'pusher-js/react-native';
import { AuthContext } from '../context/auth-context';
import { NotificationsProvider } from '../context/notifications-context';
import { decodeJwt } from '../lib/jwt';
import "../../global.css";

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
                if (key) {
                    // Runtime role guard: validate the stored JWT contains a GlobalAdmin role.
                    // This evicts any stale or non-admin token that may have been stored
                    // before this RBAC enforcement was in place.
                    const payload = decodeJwt(key);
                    if (payload?.role !== 'GlobalAdmin') {
                        console.warn('[Auth] Stored token has non-admin role. Evicting.');
                        await SecureStore.deleteItemAsync('secure_admin_api_key');
                        setIsAuthenticated(false);
                    } else {
                        setIsAuthenticated(true);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (e) {
                console.error('Error reading from SecureStore', e);
                setIsAuthenticated(false);
            } finally {
                setAuthLoading(false);
            }
        }
        checkAuth();
    }, []);

    // Listen for real-time device link revocation
    useEffect(() => {
        if (!isAuthenticated) return;

        let pusher: InstanceType<typeof Pusher> | null = null;
        let channelName = '';

        async function setupPusherListener() {
            try {
                const key = await SecureStore.getItemAsync('secure_admin_api_key');
                if (!key) return;

                const payload = decodeJwt(key);
                if (!payload || !payload.jti) {
                    console.warn('Unable to decode JWT JTI for revocation listener.');
                    return;
                }

                const pusherKey = process.env.EXPO_PUBLIC_PUSHER_KEY;
                const pusherCluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;

                if (!pusherKey || !pusherCluster) {
                    console.warn('Pusher environment variables are not configured.');
                    return;
                }

                // Initialize Pusher — Metro resolves the CJS bundle correctly,
                // but sometimes requires checking for a .default property depending on Babel/Metro configs.
                const PusherClient = (Pusher as any).default || Pusher;
                const client = new PusherClient(pusherKey, {
                    cluster: pusherCluster,
                    forceTLS: true,
                });
                pusher = client;

                // 2. Define the channel name
                channelName = `device-${payload.jti}`;

                // 3. Subscribe to the channel
                const channel = client.subscribe(channelName);

                // 4. Bind to the specific event
                channel.bind('device_unlinked', async (data: any) => {
                    console.log('⚠️ Remote wipe triggered by Global Admin!', data);
                    try {
                        await SecureStore.deleteItemAsync('secure_admin_api_key');
                        setIsAuthenticated(false);
                        Alert.alert(
                            'Access Revoked',
                            'An administrator has revoked this device\'s access to the system. You have been signed out.'
                        );
                        router.replace('/(auth)/connect');
                    } catch (error) {
                        console.error('Error removing secure api key', error);
                        setIsAuthenticated(false);
                        router.replace('/(auth)/connect');
                    }
                });
            } catch (error) {
                console.error('Error initializing Pusher listener:', error);
            }
        }

        setupPusherListener();

        return () => {
            if (pusher) {
                if (channelName) {
                    pusher.unsubscribe(channelName);
                }
                pusher.disconnect();
            }
        };
    }, [isAuthenticated]);

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
            <NotificationsProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
                </Stack>
            </NotificationsProvider>
        </AuthContext.Provider>
    );
}