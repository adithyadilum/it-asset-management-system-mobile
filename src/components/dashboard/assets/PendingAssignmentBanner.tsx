import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, ChevronRight } from 'lucide-react-native';
interface PendingAssignmentBannerProps {
  count: number;
  onPress: () => void;
}

/**
 * Banner shown at the top of My Assets when the user has one or more
 * assignments awaiting their acknowledgment (state = 'pending approval').
 * Light theme warning notification style.
 */
export function PendingAssignmentBanner({
  count,
  onPress,
}: PendingAssignmentBannerProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <Pressable
        style={({ pressed }) => [
          nativeStyles.panel,
          pressed && {
            opacity: 0.85,
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${count} asset${count !== 1 ? 's' : ''} awaiting acknowledgment. Tap to review.`}
      >
        {/* Row 1: Header (Bell + Action Required ... Review >) */}
        <View style={nativeStyles.row}>
          {/* Left: Bell Icon + Action Required Text */}
          <View style={nativeStyles.row2}>
            <Bell size={15} color="#D97706" strokeWidth={2} fill="#FCD34D" />
            <Text style={nativeStyles.text}>Action Required</Text>
          </View>

          {/* Right: Review > CTA */}
          <View style={nativeStyles.row3}>
            <Text style={nativeStyles.text2}>Review</Text>
            <ChevronRight size={13} color="#D97706" strokeWidth={2.5} />
          </View>
        </View>

        {/* Row 2: Description */}
        <Text style={nativeStyles.text3}>
          {count === 1
            ? 'You have a new asset awaiting your acknowledgment.'
            : `You have ${count} assets awaiting your acknowledgment.`}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
const nativeStyles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(255, 251, 235, 0.6)',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 11,
    fontFamily: 'NotoSans_700Bold',
    color: '#92400E',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text2: {
    fontSize: 12,
    fontFamily: 'NotoSans_700Bold',
    color: '#92400E',
  },
  text3: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: 'rgba(120, 53, 15, 0.8)',
    lineHeight: 20,
    marginTop: 10,
  },
});
