import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    NotoSans_400Regular,
    NotoSans_700Bold
} from '@expo-google-fonts/noto-sans';
import "../global.css"; // Move your global CSS import here!

// Prevent the splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        NotoSans_400Regular,
        NotoSans_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null; // Keep showing the splash screen
    }

    return (
        // This renders your app/index.tsx screen
        <Stack screenOptions={{ headerShown: false }} />
    );
}