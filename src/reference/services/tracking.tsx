import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useEffect, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';

// import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';
import { api } from '@/api/client copy';

type VendorLocation = {
  latitude: number;
  longitude: number;
  created_at?: string;
};

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [location, setLocation] = useState<VendorLocation | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    let mounted = true;

    const fetchLocation = async () => {
      try {
        const response = await api.get('', {
          params: {
            path: `bookings/${id}/location`,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (mounted && response.data?.success && response.data?.location) {
          const data = response.data.location;

          setLocation({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            created_at: data.created_at,
          });
        }
      } catch (error) {
        console.error('VENDOR LOCATION ERROR:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLocation();

    const interval = setInterval(fetchLocation, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id, token]);

  /* async function loadVendorLocation(mounted = true) {
    try {
      const response = await api.get('', {
        params: {
          path: `bookings/${id}/location`,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (mounted && response.data?.success && response.data?.location) {
        const vendorLocation = response.data.location;

        setLocation({
          latitude: Number(vendorLocation.latitude),

          longitude: Number(vendorLocation.longitude),

          created_at: vendorLocation.created_at,
        });
      }
    } catch (error) {
      console.error('VENDOR LOCATION ERROR:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  } */

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

        {loading && <Text style={styles.coordinates}>Getting provider location...</Text>}

        {!loading && location && (
          <Text style={styles.coordinates}>
            {location.latitude.toFixed(5)}
            {' , '}
            {location.longitude.toFixed(5)}
          </Text>
        )}

        {!loading && !location && (
          <Text style={styles.coordinates}>Waiting for provider location...</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Provider location</Text>

        {location ? (
          <Text style={styles.infoText}>
            Location updated at{' '}
            {location.created_at ? new Date(location.created_at).toLocaleTimeString() : 'recently'}
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
