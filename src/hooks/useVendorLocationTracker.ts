import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { updateLocation } from '../api/vendor';

export function useVendorLocationTracker(isOnline: boolean) {
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startLocationTracking() {
      // 1. Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Location] Permission to access location was denied');
        return;
      }

      // 2. Start watching position with thresholds
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update at most every 10 seconds
          distanceInterval: 10, // Update only if moved by at least 10 meters
        },
        async (location) => {
          if (!isMounted) return;

          const { latitude, longitude } = location.coords;
          try {
            await updateLocation({ latitude, longitude });
            console.log(`[Location] Location updated: ${latitude}, ${longitude}`);
          } catch (error) {
            console.error('[Location] Failed to send location update:', error);
          }
        }
      );
    }

    if (isOnline) {
      startLocationTracking();
    } else {
      if (watchSubscription.current) {
        watchSubscription.current.remove();
        watchSubscription.current = null;
      }
    }

    return () => {
      isMounted = false;
      if (watchSubscription.current) {
        watchSubscription.current.remove();
        watchSubscription.current = null;
      }
    };
  }, [isOnline]);
}
