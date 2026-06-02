import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
    useFonts,
    NotoSans_400Regular,
    NotoSans_700Bold
} from '@expo-google-fonts/noto-sans';
import { Pusher } from 'pusher-js/react-native';
import { AuthContext } from './auth-context';
import "../../global.css"; // Move your global CSS import here!

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function atobPolyfill(input: string): string {
    const str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 === 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    for (let bc = 0, bs = 0, buffer = 0, idx = 0; idx < str.length; idx++) {
        const char = str.charAt(idx);
        const pos = chars.indexOf(char);
        if (pos === -1) continue;

        buffer = (buffer << 6) + pos;
        bc += 6;

        if (bc >= 8) {
            bc -= 8;
            output += String.fromCharCode((buffer >> bc) & 0xff);
            buffer &= (1 << bc) - 1;
        }
    }

    return output;
}

function decodeJwt(token: string) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = typeof atob === 'function' ? atob(base64) : atobPolyfill(base64);
        return JSON.parse(decoded);
    } catch (e) {
        console.error('Error decoding JWT payload:', e);
        return null;
    }
}

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
                // so Pusher is directly the constructor (no .default interop needed).
                const client = new Pusher(pusherKey, {
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
                    } catch (error) {
                        console.error('Error removing secure api key', error);
                        setIsAuthenticated(false);
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
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            </Stack>
        </AuthContext.Provider>
    );
}