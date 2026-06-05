import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

/**
 * Icon name → Unicode symbol mapping.
 * Avoids adding a heavy icon library dependency.
 */
const ICON_MAP: Record<string, string> = {
  // Navigation
  home: '🏠',
  'home-outline': '🏡',
  clipboard: '📋',
  'clipboard-outline': '📋',
  bell: '🔔',
  'bell-outline': '🔔',

  // Actions
  camera: '📷',
  scan: '⊞',
  'qr-code': '⊞',
  search: '🔍',
  
  // UI elements
  chevronRight: '›',
  chevronLeft: '‹',
  chevronDown: '⌄',
  close: '✕',
  check: '✓',
  plus: '+',

  // Status
  alert: '⚠',
  info: 'ℹ',
  success: '✓',
  error: '✕',

  // Misc
  settings: '⚙',
  user: '👤',
  logout: '↪',
  refresh: '↻',
};

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Lightweight icon component using Unicode symbols.
 * Avoids heavy icon library dependency.
 */
export function IconSymbol({ name, size = 20, color = Colors.foreground, className = '' }: IconSymbolProps) {
  const symbol = ICON_MAP[name] || '•';

  return (
    <Text
      style={[styles.icon, { fontSize: size, color }]}
      className={className}
      allowFontScaling={false}
    >
      {symbol}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    lineHeight: undefined, // Let it auto-calculate based on fontSize
  },
});
