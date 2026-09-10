import * as Location from 'expo-location';
import { updateVendorLocation } from '../api/vendor';

export async function startVendorLocationTracking(bookingId: number) {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission is required.');
  }

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    async (location) => {
      try {
        const { latitude, longitude, heading, speed, accuracy } = location.coords;

        await updateVendorLocation({
          booking_id: bookingId,
          latitude,
          longitude,
          heading: heading ?? undefined,
          speed: speed ?? undefined,
          accuracy: accuracy ?? undefined,
        });
      } catch (error) {
        console.error('Location upload failed:', error);
      }
    }
  );

  return subscription;
}
