import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { useEffect, useState } from 'react';

import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { useLocalSearchParams } from 'expo-router';

import { api } from '../../../api/client';

import { useAuthStore } from '../../../store/authStore';

type VendorLocation = {
  latitude: number;

  longitude: number;

  heading?: number;

  speed?: number;

  recorded_at?: string;
};

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [location, setLocation] = useState<VendorLocation | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocation();

    /*
     * Poll every 5 seconds.
     *
     * Later we can replace this
     * with a realtime service.
     */

    const interval = setInterval(loadLocation, 5000);

    return () => clearInterval(interval);
  }, [id]);

  async function loadLocation() {
    try {
      const response = await api.get(
        `/bookings/${id}/location`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setLocation(response.data.location);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />

        <Text style={styles.loadingText}>Finding provider...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Provider location unavailable</Text>

        <Text style={styles.subtitle}>The provider has not shared a recent location yet.</Text>
      </View>
    );
  }

  const region: Region = {
    latitude: Number(location.latitude),

    longitude: Number(location.longitude),

    latitudeDelta: 0.02,

    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}

        provider={PROVIDER_GOOGLE}

        initialRegion={region}

        showsUserLocation

        showsMyLocationButton>
        <Marker
          coordinate={{
            latitude: Number(location.latitude),

            longitude: Number(location.longitude),
          }}

          title="Service Provider"

          description="Your provider is here."
        />
      </MapView>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>🚗 Provider location</Text>

        <Text style={styles.statusText}>Location updates automatically.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 15,
    color: '#6B7280',
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  statusCard: {
    position: 'absolute',

    left: 15,

    right: 15,

    bottom: 25,

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    padding: 18,

    shadowColor: '#000',

    shadowOpacity: 0.15,

    shadowRadius: 10,

    elevation: 5,
  },

  statusTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  statusText: {
    marginTop: 5,
    color: '#6B7280',
  },
});
