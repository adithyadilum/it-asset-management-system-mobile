import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';

type StateType = 'loading' | 'error' | 'empty';

interface StateMessageProps {
  type: StateType;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

/**
 * Reusable component for displaying loading, error, and empty states.
 * Uses NativeWind for styling.
 */
export function StateMessage({
  type,
  message,
  onRetry,
  retryText = 'Retry',
}: StateMessageProps) {
  return (
    <View className="items-center py-6 gap-y-2.5">
      {type === 'loading' && (
        <>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text className="text-[13px] font-sans text-muted-foreground mt-2">
            {message || 'Loading...'}
          </Text>
        </>
      )}

      {type === 'error' && (
        <>
          <Text className="text-[13px] font-sans text-destructive text-center px-4">
            {message || 'An error occurred.'}
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              className="px-5 py-2 bg-primary rounded-lg mt-1"
            >
              <Text className="text-[13px] font-sansBold text-white">
                {retryText}
              </Text>
            </Pressable>
          )}
        </>
      )}

      {type === 'empty' && (
        <Text className="text-[13px] font-sans text-muted-foreground mt-2 text-center px-4">
          {message || 'No data found.'}
        </Text>
      )}
    </View>
  );
}
