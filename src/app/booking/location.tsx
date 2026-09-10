import React, { useEffect, useState } from 'react';

import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import MapView, { Marker, MapPressEvent } from 'react-native-maps';

import { router, useLocalSearchParams } from 'expo-router';

import { getCurrentLocation, UserLocation } from '../../location/location';

export default function LocationScreen() {
  const params = useLocalSearchParams<{
    service: string;
  }>();

  const service = params.service;

  const [pickup, setPickup] = useState<UserLocation | null>(null);

  const [destination, setDestination] = useState<UserLocation | null>(null);

  const [loading, setLoading] = useState(true);

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  async function loadCurrentLocation() {
    try {
      setLoading(true);

      const location = await getCurrentLocation();

      setPickup(location);
    } catch (error: any) {
      Alert.alert('Location unavailable', error.message || 'Unable to determine your location.');
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    try {
      setLocating(true);

      const location = await getCurrentLocation();

      setPickup(location);
    } catch (error: any) {
      Alert.alert('Location unavailable', error.message);
    } finally {
      setLocating(false);
    }
  }

  function handleMapPress(event: MapPressEvent) {
    const coordinate = event.nativeEvent.coordinate;

    /*
     * First map selection is pickup.
     *
     * For ride/tow, the second
     * selection becomes destination.
     */

    if (!pickup) {
      setPickup({
        latitude: coordinate.latitude,

        longitude: coordinate.longitude,
      });

      return;
    }

    if (service === 'ride' || service === 'tow') {
      setDestination({
        latitude: coordinate.latitude,

        longitude: coordinate.longitude,
      });
    }
  }

  function continueBooking() {
    if (!pickup) {
      Alert.alert('Pickup required', 'Please select your pickup location.');

      return;
    }

    if ((service === 'ride' || service === 'tow') && !destination) {
      Alert.alert('Destination required', 'Please select a destination.');

      return;
    }

    router.push({
      pathname: './details',

      params: {
        service,

        pickupLatitude: pickup.latitude.toString(),

        pickupLongitude: pickup.longitude.toString(),

        destinationLatitude: destination?.latitude.toString() || '',

        destinationLongitude: destination?.longitude.toString() || '',
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  /*
   * Fallback map location.
   *
   * This should only be reached if
   * location permission failed.
   */

  const initialRegion = {
    latitude: pickup?.latitude ?? 49.8951,

    longitude: pickup?.longitude ?? -97.1384,

    latitudeDelta: 0.02,

    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Location</Text>

        <Text style={styles.subtitle}>
          {service === 'mechanic'
            ? 'Confirm where your vehicle is located.'
            : 'Select pickup and destination.'}
        </Text>
      </View>

      <MapView
        style={styles.map}

        initialRegion={initialRegion}

        showsUserLocation

        showsMyLocationButton={false}

        onPress={handleMapPress}>
        {pickup && (
          <Marker
            coordinate={pickup}
            title="Pickup"
            description="Service pickup location"
            pinColor="#2563EB"
          />
        )}

        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            description="Service destination"
            pinColor="#16A34A"
          />
        )}
      </MapView>

      <View style={styles.bottomPanel}>
        <Pressable onPress={useMyLocation} style={styles.locationButton}>
          <Text style={styles.locationButtonText}>
            {locating ? 'Locating...' : '📍 Use My Current Location'}
          </Text>
        </Pressable>

        <Text style={styles.instruction}>
          {service === 'mechanic'
            ? 'Tap the map to set your vehicle location.'
            : destination
              ? 'Pickup and destination selected.'
              : 'Tap the map to select your destination.'}
        </Text>

        <Pressable onPress={continueBooking} style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  header: {
    paddingHorizontal: 20,

    paddingTop: 20,

    paddingBottom: 12,
  },

  title: {
    fontSize: 26,

    fontWeight: '700',
  },

  subtitle: {
    color: '#6B7280',

    marginTop: 5,
  },

  map: {
    flex: 1,
  },

  bottomPanel: {
    padding: 18,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,

    borderTopColor: '#E5E7EB',
  },

  locationButton: {
    borderWidth: 1,

    borderColor: '#2563EB',

    borderRadius: 12,

    padding: 13,

    alignItems: 'center',
  },

  locationButtonText: {
    color: '#2563EB',

    fontWeight: '700',
  },

  instruction: {
    color: '#6B7280',

    textAlign: 'center',

    marginTop: 12,

    marginBottom: 12,
  },

  button: {
    backgroundColor: '#2563EB',

    borderRadius: 12,

    padding: 16,

    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',

    fontWeight: '700',

    fontSize: 16,
  },

  loadingContainer: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,

    color: '#6B7280',
  },
});
