import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { useNotificationObserver } from '@/hooks/useNotificationObserver';

export default function RootLayout() {
  // Listen for push notification taps globally across the entire app
  useNotificationObserver();

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
