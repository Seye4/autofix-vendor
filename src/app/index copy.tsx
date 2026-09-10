import { View, ActivityIndicator } from 'react-native';

import { router } from 'expo-router';

import { useEffect } from 'react';

import { useAppStore } from '../store/appStore';

import { useAuthStore } from '../store/authStore';

export default function Index() {
  const appLoading = useAppStore((state) => state.loading);

  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  const loadAppState = useAppStore((state) => state.loadAppState);

  const authLoading = useAuthStore((state) => state.loading);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    async function initialize() {
      await loadAppState();
    }

    initialize();
  }, []);

  useEffect(() => {
    if (appLoading || authLoading) {
      return;
    }

    if (!onboardingComplete) {
      router.replace('/onboarding');

      return;
    }

    if (user) {
      router.replace('/(protected)/home');

      return;
    }

    router.replace('/login');
  }, [appLoading, authLoading, onboardingComplete, user]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ActivityIndicator size="large" color="#16A34A" />
    </View>
  );
}
