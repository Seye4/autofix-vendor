import * as Location from 'expo-location';

import { api } from '../api/client';

export async function sendVendorLocation(token: string, bookingId: number) {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Location permission is required.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  await api.post(
    '',
    {
      latitude: location.coords.latitude,

      longitude: location.coords.longitude,

      heading: location.coords.heading,

      speed: location.coords.speed,
    },
    {
      params: {
        path: `vendor/jobs/${bookingId}/location`,
      },

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}
