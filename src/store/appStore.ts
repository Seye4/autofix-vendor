import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type AppState = {
  onboardingComplete: boolean;
  loading: boolean;

  loadAppState: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

export const useAppStore = create<AppState>((set) => ({
  onboardingComplete: false,

  loading: true,

  loadAppState: async () => {
    try {
      console.log('[AppStore] Loading app state...');

      const value = await AsyncStorage.getItem('onboarding_complete');
      const onboardingComplete = value === 'true';

      console.log('[AppStore] onboarding_complete:', value);

      set({
        onboardingComplete,
        loading: false,
      });

      console.log('[AppStore] App state loaded:', onboardingComplete);
    } catch (error) {
      console.error('[AppStore] Failed to load app state:', error);

      set({
        onboardingComplete: false,
        loading: false,
      });
    }
  },

  completeOnboarding: async () => {
    try {
      console.log('[AppStore] Completing onboarding...');

      await AsyncStorage.setItem('onboarding_complete', 'true');

      set({
        onboardingComplete: true,
      });

      console.log('[AppStore] Onboarding marked complete.');
    } catch (error) {
      console.error('[AppStore] Failed to save onboarding state:', error);

      throw error;
    }
  },

  resetOnboarding: async () => {
    try {
      console.log('[AppStore] Resetting onboarding state...');

      await AsyncStorage.removeItem('onboarding_complete');

      set({
        onboardingComplete: false,
      });

      console.log('[AppStore] Onboarding state reset.');
    } catch (error) {
      console.error('[AppStore] Failed to reset onboarding state:', error);

      throw error;
    }
  },
}));
