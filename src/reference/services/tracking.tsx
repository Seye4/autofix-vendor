import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { useEffect, useState } from 'react';

import * as Location from 'expo-location';

import { useLocalSearchParams, router } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    loadVendorLocation();

    const interval = setInterval(loadVendorLocation, 5000);

    return () => clearInterval(interval);
  }, [id]);

  async function loadVendorLocation() {
    try {
      const response = await api.get('', {
        params: {
          path: `bookings/${id}/location`,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setLocation(response.data.location);
      }
    } catch {
      // Continue polling.
    }
  }

  /*
   * This will be used by the vendor app.
   *
   * Keeping it here shows how location
   * permissions should be requested.
   */

  async function requestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert('Location required', 'Location permission is required for tracking.');

      return;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Track Provider</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>📍</Text>

        <Text style={styles.mapText}>Live Map</Text>

        {location && (
          <Text style={styles.coordinates}>
            {Number(location.latitude).toFixed(5)}
            {' , '}
            {Number(location.longitude).toFixed(5)}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Provider location</Text>

        {location ? (
          <Text style={styles.infoText}>
            Location updated at {new Date(location.created_at).toLocaleTimeString()}
          </Text>
        ) : (
          <Text style={styles.infoText}>Waiting for provider location...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 55,
    padding: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    fontSize: 30,
    marginRight: 15,
  },

  title: {
    fontSize: 21,
    fontWeight: '900',
  },

  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#DDE8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapIcon: {
    fontSize: 50,
  },

  mapText: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },

  coordinates: {
    marginTop: 10,
    color: '#374151',
  },

  info: {
    backgroundColor: '#FFFFFF',
    padding: 22,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  infoText: {
    color: '#6B7280',
    marginTop: 6,
  },
});
