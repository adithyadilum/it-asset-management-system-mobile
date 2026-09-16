import { logger } from '../lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View, Alert, Image, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
    useFonts,
    NotoSans_400Regular,
    NotoSans_700Bold
} from '@expo-google-fonts/noto-sans';

import { AuthContext } from '../context/auth-context';
import { NotificationsProvider } from '../context/notifications-context';
import { decodeJwt, isStoredTokenUsable } from '../lib/jwt';
import {
    clearStoredToken,
    getApiUrl,
    getStoredToken,
    setUnauthenticatedHandler,
} from '../constants/api';
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

    // Validates the stored token's role *and* expiry, evicting anything stale.
    const checkAuth = useCallback(async () => {
        try {
            const key = await getStoredToken();
            if (isStoredTokenUsable(key)) {
                setIsAuthenticated(true);
            } else {
                if (key) await clearStoredToken();
                setIsAuthenticated(false);
            }
        } catch (e) {
            logger.error('Error reading from SecureStore', e);
            setIsAuthenticated(false);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // A token can expire while the app sits in the background, so the guard is
    // re-run on every return to the foreground rather than only at mount.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') checkAuth();
        });
        return () => subscription.remove();
    }, [checkAuth]);

    const signOut = useCallback(async () => {
        await clearStoredToken();
        setIsAuthenticated(false);
    }, []);

    // The API client cannot import React context, so it is handed the callback
    // it should invoke when the server rejects our token (M-09).
    useEffect(() => {
        setUnauthenticatedHandler(() => {
            setIsAuthenticated(false);
        });
        return () => setUnauthenticatedHandler(null);
    }, []);

    // Listen for real-time device link revocation
    useEffect(() => {
        if (!isAuthenticated) return;

        // Structural type: the Pusher constructor is resolved dynamically
        // below, so there is no imported class to reference here.
        type PusherClient = {
            subscribe: (channel: string) => {
                bind: (event: string, handler: () => void) => void;
            };
            unsubscribe: (channel: string) => void;
            disconnect: () => void;
        };

        let pusher: PusherClient | null = null;
        let channelName = '';

        async function setupPusherListener() {
            try {
                const key = await getStoredToken();
                if (!key) return;

                const payload = decodeJwt(key);
                if (!payload || !payload.jti) {
                    logger.warn('Unable to decode JWT JTI for revocation listener.');
                    return;
                }

                const pusherKey = process.env.EXPO_PUBLIC_PUSHER_KEY;
                const pusherCluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;

                if (!pusherKey || !pusherCluster) {
                    logger.warn('Pusher environment variables are not configured.');
                    return;
                }

                // Initialize Pusher using standard require to bypass Metro ES6 interop issues.
                const PusherModule = require('pusher-js');
                let PusherConstructor = PusherModule;
                
                if (PusherModule && typeof PusherModule.default === 'function') {
                    PusherConstructor = PusherModule.default;
                } else if (PusherModule && typeof PusherModule.default === 'object' && typeof PusherModule.default.Pusher === 'function') {
                    PusherConstructor = PusherModule.default.Pusher;
                } else if (PusherModule && typeof PusherModule.Pusher === 'function') {
                    PusherConstructor = PusherModule.Pusher;
                }

                if (typeof PusherConstructor !== 'function') {
                    logger.error('Failed to resolve Pusher constructor. Module:', PusherModule);
                    return;
                }

                const client = new PusherConstructor(pusherKey, {
                    cluster: pusherCluster,
                    forceTLS: true,
                    // Private channels are authorized server-side, so only the
                    // device that owns this JTI can subscribe (M-05). The bearer
                    // token identifies us to the auth endpoint.
                    channelAuthorization: {
                        endpoint: `${getApiUrl()}/api/v1/pusher/auth`,
                        transport: 'ajax',
                        headers: { Authorization: `Bearer ${key}` },
                    },
                });
                pusher = client;

                // 2. Define the channel name
                channelName = `private-device-${payload.jti}`;

                // 3. Subscribe to the channel
                const channel = client.subscribe(channelName);

                // 4. Bind to the specific event
                channel.bind('device_unlinked', async () => {
                    // Deliberately logs nothing: the payload identifies the
                    // device and the event itself is visible in the UI.
                    try {
                        await clearStoredToken();
                        setIsAuthenticated(false);
                        Alert.alert(
                            'Access Revoked',
                            'An administrator has revoked this device\'s access to the system. You have been signed out.'
                        );
                        router.replace('/(auth)/connect');
                    } catch (error) {
                        logger.error('Error removing secure api key', error);
                        setIsAuthenticated(false);
                        router.replace('/(auth)/connect');
                    }
                });
            } catch (error) {
                logger.error('Error initializing Pusher listener:', error);
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
            <View className="flex-1 items-center justify-center bg-background gap-y-8">
                <Image 
                    source={require('../../assets/icon.png')} 
                    style={{ width: 120, height: 120, borderRadius: 24 }}
                    resizeMode="contain"
                />
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ setIsAuthenticated, signOut }}>
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