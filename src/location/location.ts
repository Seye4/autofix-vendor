import * as Location from 'expo-location';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission is required to use this service.');
  }

  return true;
}

export async function getCurrentLocation(): Promise<UserLocation> {
  await requestLocationPermission();

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,

    longitude: location.coords.longitude,
  };
}
