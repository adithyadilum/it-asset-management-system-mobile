/**
 * Centralized API configuration.
 * Even though we're using mock data now, this sets the structure
 * for future API integration.
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const ENDPOINTS = {
  // Auth
  mobileExchange: '/api/auth/mobile-exchange',

  // Assets
  assets: '/api/assets',
  assetById: (id: string) => `/api/assets/${id}`,
  assetByTag: (tag: string) => `/api/assets/tag/${tag}`,
  myAssets: '/api/v1/assets/my-assets',

  // Dashboard
  dashboard: '/api/dashboard',
  metrics: '/api/dashboard/metrics',
  activities: '/api/dashboard/activities',

  // Notifications
  notifications: '/api/notifications',
} as const;
