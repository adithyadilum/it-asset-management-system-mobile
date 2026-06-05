/**
 * Semantic color constants for use in StyleSheet contexts
 * where NativeWind classes aren't available (e.g., status bar tint, icon fills).
 * Values mirror the CSS tokens from global.css.
 */

export const Colors = {
  // Brand
  primary: '#040D5A',
  primaryLight: '#0A1A8A',
  primaryForeground: '#FFFFFF',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSubtle: '#F8FAFC',
  foreground: '#0F172A',

  // Card
  card: '#FFFFFF',
  cardForeground: '#0F172A',

  // Muted
  muted: '#F1F5F9',
  mutedForeground: '#64748B',

  // Border
  border: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#CBD5E1',

  // Destructive
  destructive: '#EF4444',
  destructiveLight: '#FEE2E2',
  destructiveForeground: '#FFFFFF',
  // Success
  success: '#65A30D',
  successForeground: '#FFFFFF',
  successLight: '#F0FEE0',

  // Warning / Info
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Status colors
  status: {
    new: '#2B4ACB',
    assigned: '#4B5563',
    lost: '#C2410C',
    disposed: '#374151',
    repair: '#7C3AED',
  },

  // Status light backgrounds
  statusLight: {
    assigned: '#DBEAFE',
    lost: '#FED7AA',
    repair: '#EDE9FE',
  },

  // Tab bar
  tabActive: '#040D5A',
  tabInactive: '#94A3B8',

  // Scanner
  scannerOverlay: 'rgba(0, 0, 0, 0.6)',
  scannerCorner: '#FFFFFF',

  // Notification badge
  notificationBadge: '#EF4444',
} as const;
