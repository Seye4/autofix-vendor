import React, { useEffect, useState } from 'react';

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import MapView, { Marker, Polyline } from 'react-native-maps';

import { getTracking, TrackingData } from '../../api/tracking';

import { useAuth } from '../../context/AuthContext';

export default function ProgressScreen() {
  const { bookingId } = useLocalSearchParams<{
    bookingId: string;
  }>();

  const { token } = useAuth();

  const [tracking, setTracking] = useState<TrackingData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();

    const interval = setInterval(loadTracking, 5000);

    return () => clearInterval(interval);
  }, [token, bookingId]);

  async function loadTracking() {
    if (!token) {
      return;
    }

    try {
      const response = await getTracking(token, Number(bookingId));

      setTracking(response.data.tracking);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!tracking) {
    return (
      <View style={styles.center}>
        <Text>Tracking unavailable.</Text>
      </View>
    );
  }

  const vendorLatitude = Number(tracking.current_latitude);

  const vendorLongitude = Number(tracking.current_longitude);

  const pickupLatitude = Number(tracking.pickup_latitude);

  const pickupLongitude = Number(tracking.pickup_longitude);

  const hasVendorLocation = Number.isFinite(vendorLatitude) && Number.isFinite(vendorLongitude);

  const initialLatitude = hasVendorLocation ? vendorLatitude : pickupLatitude;

  const initialLongitude = hasVendorLocation ? vendorLongitude : pickupLongitude;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}

        initialRegion={{
          latitude: initialLatitude,

          longitude: initialLongitude,

          latitudeDelta: 0.04,

          longitudeDelta: 0.04,
        }}>
        {hasVendorLocation && (
          <Marker
            coordinate={{
              latitude: vendorLatitude,

              longitude: vendorLongitude,
            }}

            title={tracking.business_name || 'Service Provider'}

            description={'Your service provider'}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>🚗</Text>
            </View>
          </Marker>
        )}

        {Number.isFinite(pickupLatitude) && (
          <Marker
            coordinate={{
              latitude: pickupLatitude,

              longitude: pickupLongitude,
            }}

            title="Pickup location"
          />
        )}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.status}>{formatStatus(tracking.status)}</Text>

        {tracking.business_name && <Text style={styles.vendor}>{tracking.business_name}</Text>}

        {tracking.vehicle_make && (
          <Text style={styles.vehicle}>
            {tracking.vehicle_make} {tracking.vehicle_model}
          </Text>
        )}

        {tracking.vehicle_plate && <Text style={styles.plate}>{tracking.vehicle_plate}</Text>}

        <View style={styles.buttons}>
          {tracking.vendor_id && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(customer)/chat',

                  params: {
                    bookingId: bookingId,

                    vendorId: tracking.vendor_id!.toString(),
                  },
                })
              }

              style={styles.chatButton}>
              <Text style={styles.chatText}>💬 Chat</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case 'searching':
      return 'Finding a provider';

    case 'accepted':
      return 'Provider accepted';

    case 'arriving':
      return 'Provider is on the way';

    case 'arrived':
      return 'Provider has arrived';

    case 'in_progress':
      return 'Service in progress';

    case 'completed':
      return 'Service completed';

    case 'cancelled':
      return 'Booking cancelled';

    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  map: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  marker: {
    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: '#2563EB',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 3,

    borderColor: '#FFFFFF',
  },

  markerText: {
    fontSize: 22,
  },

  panel: {
    backgroundColor: '#FFFFFF',

    padding: 20,

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    shadowColor: '#000',

    shadowOpacity: 0.1,

    shadowRadius: 10,

    elevation: 10,
  },

  status: {
    fontSize: 20,

    fontWeight: '700',
  },

  vendor: {
    fontSize: 17,

    fontWeight: '600',

    marginTop: 8,
  },

  vehicle: {
    color: '#6B7280',

    marginTop: 5,
  },

  plate: {
    fontWeight: '700',

    marginTop: 5,
  },

  buttons: {
    flexDirection: 'row',

    marginTop: 15,
  },

  chatButton: {
    backgroundColor: '#2563EB',

    paddingHorizontal: 20,

    paddingVertical: 12,

    borderRadius: 10,
  },

  chatText: {
    color: '#FFFFFF',

    fontWeight: '700',
  },
});
