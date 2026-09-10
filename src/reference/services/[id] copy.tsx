import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { useEffect, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

const statuses = ['pending', 'accepted', 'arriving', 'in_progress', 'completed'];

export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const mapRef = useRef<MapView>(null);

  const token = useAuthStore((state) => state.token);

  const [booking, setBooking] = useState<any>(null);

  const [location, setLocation] = useState<any>(null);

  async function loadService() {
    try {
      const response = await api.get('', {
        params: {
          path: `bookings/${id}`,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setBooking(response.data.booking);
      }
    } catch {
      Alert.alert('Error', 'Unable to load service.');
    }
  }

  async function loadLocation() {
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
      // Ignore temporary
      // location errors.
    }
  }

  useEffect(() => {
    loadService();

    const interval = setInterval(() => {
      loadService();

      loadLocation();
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!location || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: Number(location.latitude),

        longitude: Number(location.longitude),

        latitudeDelta: 0.02,

        longitudeDelta: 0.02,
      },
      800
    );
  }, [location]);

  if (!booking) {
    return (
      <View style={styles.loading}>
        <Text>Loading service...</Text>
      </View>
    );
  }

  const currentIndex = statuses.indexOf(booking.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Service</Text>
      </View>

      <Text style={styles.bookingNumber}>{booking.booking_number}</Text>

      <Text style={styles.service}>
        <Text style={styles.service}>{booking.service_type?.toUpperCase()}</Text>
      </Text>

      <View style={styles.timeline}>
        {statuses.map((status, index) => {
          const active = index <= currentIndex;

          return (
            <View key={status} style={styles.timelineRow}>
              <View>
                <View style={[styles.dot, active && styles.activeDot]} />

                {index < statuses.length - 1 && (
                  <View style={[styles.line, active && styles.activeLine]} />
                )}
              </View>

              <Text style={[styles.statusText, active && styles.activeStatus]}>
                {formatStatus(status)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* <View style={styles.map}>
        <Text style={styles.mapTitle}>Vendor location</Text>

        {location ? (
          <>
            <Text style={styles.coordinates}>
              📍 {Number(location.latitude).toFixed(6)}
              {', '}
              {Number(location.longitude).toFixed(6)}
            </Text>

            <Text style={styles.mapNote}>Live location received</Text>
          </>
        ) : (
          <Text style={styles.mapNote}>Waiting for vendor location...</Text>
        )}
      </View> */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: Number(location.latitude),

              longitude: Number(location.longitude),

              latitudeDelta: 0.02,

              longitudeDelta: 0.02,
            }}>
            <Marker
              coordinate={{
                latitude: Number(booking.pickup_latitude),

                longitude: Number(booking.pickup_longitude),
              }}
              title="Your location"
            />

            <Marker
              coordinate={{
                latitude: Number(location.latitude),

                longitude: Number(location.longitude),
              }}
              title="Service provider"
              description="Your provider"
            />
          </MapView>
        ) : (
          <View style={styles.noLocation}>
            <Text>Waiting for provider location...</Text>
          </View>
        )}
      </View>

      {booking.vendor_name && (
        <View style={styles.vendor}>
          <Text style={styles.vendorTitle}>Your service provider</Text>

          <Text>{booking.vendor_name}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: {
              id: String(id),
            },
          })
        }>
        <Text style={styles.chatText}>💬 Chat with provider</Text>
      </TouchableOpacity>
    </View>
  );
}

/* function formatStatus(status: string) {
  return status.replace('_', ' ').replace(/^\w/, (char) => char.toUpperCase());
} */
function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F8FAFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
  },

  bookingNumber: {
    marginTop: 20,
    color: '#6B7280',
  },

  service: {
    marginTop: 5,
    color: '#16A34A',
    fontSize: 18,
    fontWeight: '900',
  },

  timeline: {
    marginTop: 25,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 55,
  },

  dot: {
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
  },

  activeDot: {
    backgroundColor: '#16A34A',
  },

  line: {
    width: 2,
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#D1D5DB',
  },

  activeLine: {
    backgroundColor: '#16A34A',
  },

  statusText: {
    marginLeft: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  activeStatus: {
    color: '#111827',
    fontWeight: '800',
  },

  mapTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  coordinates: {
    marginTop: 15,
    color: '#374151',
  },

  mapNote: {
    marginTop: 8,
    color: '#6B7280',
  },

  vendor: {
    marginTop: 15,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },

  vendorTitle: {
    fontWeight: '800',
    marginBottom: 7,
  },

  chatButton: {
    marginTop: 15,
    padding: 16,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    alignItems: 'center',
  },

  chatText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  mapContainer: {
    marginTop: 20,
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  noLocation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
});
