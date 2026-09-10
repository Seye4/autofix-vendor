import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ride_service_auth_token';
// export const API_KEY = 'http://10.0.0.106/autofix/backend/api';

export const API_KEY = __DEV__
  ? 'https://seveinteractive.com/api' // Local URL (e.g., http://localhost:8000 or http://10.0.2.2/api for Android emulator)
  : 'https://seveinteractive.com/api';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
