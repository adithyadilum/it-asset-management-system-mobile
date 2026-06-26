import * as SecureStore from 'expo-secure-store';

/**
 * Centralized API configuration and fetching utility.
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function fetchApi<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('API URL is not configured.');
  }

  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await SecureStore.getItemAsync('secure_admin_api_key');
    if (!token) {
      throw new Error('Not authenticated. Please re-pair your device.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...restOptions,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignored
    }
    throw new Error(
      errorData.error || errorData.message || `API request failed (status ${response.status})`
    );
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
