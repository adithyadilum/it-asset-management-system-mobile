import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
        className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 mb-6"
        style={({ pressed }) => pressed && { opacity: 0.85 }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${count} asset${count !== 1 ? 's' : ''} awaiting acknowledgment. Tap to review.`}
      >
        {/* Row 1: Header (Bell + Action Required ... Review >) */}
        <View className="flex-row items-center justify-between">
          {/* Left: Bell Icon + Action Required Text */}
          <View className="flex-row items-center gap-2">
            <Bell size={15} color="#D97706" strokeWidth={2} fill="#FCD34D" />
            <Text className="text-[11px] font-sansBold text-amber-800 tracking-widest uppercase">
              Action Required
            </Text>
          </View>

          {/* Right: Review > CTA */}
          <View className="flex-row items-center gap-0.5">
            <Text className="text-xs font-sansBold text-amber-800">Review</Text>
            <ChevronRight size={13} color="#D97706" strokeWidth={2.5} />
          </View>
        </View>

        {/* Row 2: Description */}
        <Text className="text-[13px] font-sans text-amber-900/80 leading-5 mt-2.5">
          {count === 1
            ? 'You have a new asset awaiting your acknowledgment.'
            : `You have ${count} assets awaiting your acknowledgment.`}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
