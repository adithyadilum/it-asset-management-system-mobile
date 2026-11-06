import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
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
    <View style={nativeStyles.container}>
      {type === 'loading' && (
        <>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={nativeStyles.text}>{message || 'Loading...'}</Text>
        </>
      )}

      {type === 'error' && (
        <>
          <Text style={nativeStyles.text2}>
            {message || 'An error occurred.'}
          </Text>
          {onRetry && (
            <Pressable onPress={onRetry} style={nativeStyles.panel}>
              <Text style={nativeStyles.text3}>{retryText}</Text>
            </Pressable>
          )}
        </>
      )}

      {type === 'empty' && (
        <Text style={nativeStyles.text4}>{message || 'No data found.'}</Text>
      )}
    </View>
  );
}
const nativeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    rowGap: 10,
  },
  text: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    marginTop: 8,
  },
  text2: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  panel: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#040D5A',
    borderRadius: 10,
    marginTop: 4,
  },
  text3: {
    fontSize: 13,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  text4: {
    fontSize: 13,
    fontFamily: 'NotoSans_400Regular',
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
