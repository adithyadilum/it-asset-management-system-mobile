import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

/**
 * Primary scanner action with native press feedback.
 */
export function ScannerCard() {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handlePress = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push({
      pathname: '/(dashboard)/scanner',
      params: { operation: '' },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Launch Scanner"
      style={[
        styles.card,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={handlePress}
    >
      {/* Navy background with subtle gradient effect using layered views */}
      <View style={styles.cardBg}>
        {/* Subtle dot pattern overlay for premium texture */}
        <View style={styles.patternOverlay} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <ScanLine size={28} color="#FFFFFF" strokeWidth={1.75} />
        </View>
        <Text style={styles.title}>Launch Scanner</Text>
        <Text style={styles.subtitle}>
          Instantly scan asset barcodes{'\n'}and QR codes
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 200,
  },
  cardBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 26, 138, 0.3)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: Colors.primaryForeground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
