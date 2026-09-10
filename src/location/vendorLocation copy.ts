import * as Location from 'expo-location';

import * as TaskManager from 'expo-task-manager';

import { api } from '../api/client';

export const VENDOR_LOCATION_TASK = 'vendor-location-task';

let authToken: string | null = null;

/*
|--------------------------------------------------------------------------
| Store token
|--------------------------------------------------------------------------
*/

export function setVendorLocationToken(token: string | null) {
  authToken = token;
}

/*
|--------------------------------------------------------------------------
| Background task
|--------------------------------------------------------------------------
*/

TaskManager.defineTask(
  VENDOR_LOCATION_TASK,

  async ({ data, error }: any) => {
    if (error) {
      console.log('Location task error:', error);

      return;
    }

    if (!data?.locations) {
      return;
    }

    if (!authToken) {
      return;
    }

    for (const location of data.locations) {
      const coords = location.coords;

      try {
        await api.post(
          '/vendor/location',

          {
            latitude: coords.latitude,

            longitude: coords.longitude,

            accuracy: coords.accuracy,

            heading: coords.heading,

            speed: coords.speed,
          },

          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
      } catch (error) {
        console.log('Failed to send location', error);
      }
    }
  }
);

/*
|--------------------------------------------------------------------------
| Request permissions
|--------------------------------------------------------------------------
*/

export async function requestVendorLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();

  if (foreground.status !== 'granted') {
    throw new Error('Location permission is required.');
  }

  const background = await Location.requestBackgroundPermissionsAsync();

  if (background.status !== 'granted') {
    throw new Error('Background location permission is required.');
  }
}

/*
|--------------------------------------------------------------------------
| Start tracking
|--------------------------------------------------------------------------
*/

export async function startVendorTracking(token: string) {
  setVendorLocationToken(token);

  await requestVendorLocationPermissions();

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(VENDOR_LOCATION_TASK);

  if (alreadyRunning) {
    return;
  }

  await Location.startLocationUpdatesAsync(
    VENDOR_LOCATION_TASK,

    {
      accuracy: Location.Accuracy.High,

      timeInterval: 10000,

      distanceInterval: 20,

      pausesUpdatesAutomatically: false,

      foregroundService: {
        notificationTitle: 'Auto Service',

        notificationBody: 'Your location is being shared while you are providing a service.',

        notificationColor: '#16A34A',
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| Stop tracking
|--------------------------------------------------------------------------
*/

export async function stopVendorTracking() {
  const running = await Location.hasStartedLocationUpdatesAsync(VENDOR_LOCATION_TASK);

  if (running) {
    await Location.stopLocationUpdatesAsync(VENDOR_LOCATION_TASK);
  }

  setVendorLocationToken(null);
}
