import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

import { useEffect, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type Booking = {
  id: number;

  booking_number: string;

  service_type: string;

  status: string;

  pickup_address: string;

  destination_address?: string;

  estimated_price?: number;

  final_price?: number;

  business_name?: string;

  vendor_type?: string;

  vendor_rating?: number;
};

export default function BookingProgressScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [booking, setBooking] = useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();

    /*
     * Poll every 5 seconds.
     *
     * This works on shared hosting because
     * the server doesn't need a persistent
     * WebSocket connection.
     */

    const interval = setInterval(loadBooking, 5000);

    return () => clearInterval(interval);
  }, [id]);

  async function loadBooking() {
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
      // Keep existing data.
    } finally {
      setLoading(false);
    }
  }

  if (loading && !booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#16A34A" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Booking not found.</Text>
      </View>
    );
  }

  const steps = [
    {
      key: 'pending',
      title: 'Request submitted',
      description: "We're finding a service provider.",
    },

    {
      key: 'accepted',
      title: 'Vendor accepted',
      description: 'Your service provider has accepted.',
    },

    {
      key: 'en_route',
      title: 'Vendor is on the way',
      description: 'Your service provider is travelling to you.',
    },

    {
      key: 'arrived',
      title: 'Vendor arrived',
      description: 'Your service provider has arrived.',
    },

    {
      key: 'in_progress',
      title: 'Service in progress',
      description: 'Your requested service is underway.',
    },

    {
      key: 'completed',
      title: 'Completed',
      description: 'Your service has been completed.',
    },
  ];

  const statusOrder = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed'];

  const currentIndex = statusOrder.indexOf(booking.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Service Progress</Text>
      </View>

      <View style={styles.bookingCard}>
        <Text style={styles.bookingNumber}>{booking.booking_number}</Text>

        <Text style={styles.serviceType}>{booking.service_type.toUpperCase()}</Text>

        {booking.business_name && (
          <Text style={styles.vendor}>Provider: {booking.business_name}</Text>
        )}
      </View>

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const completed = index <= currentIndex;

          return (
            <View key={step.key} style={styles.step}>
              <View style={[styles.circle, completed && styles.circleActive]}>
                <Text style={[styles.circleText, completed && styles.circleTextActive]}>
                  {completed ? '✓' : index + 1}
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, completed && styles.activeText]}>{step.title}</Text>

                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {(booking.status === 'accepted' ||
        booking.status === 'en_route' ||
        booking.status === 'arrived') && (
        <TouchableOpacity
          style={styles.trackButton}

          onPress={() =>
            router.push({
              pathname: '/services/[id]/tracking',

              params: {
                id: String(booking.id),
              },
            })
          }>
          <Text style={styles.trackText}>📍 Track Provider</Text>
        </TouchableOpacity>
      )}

      {booking.status === 'completed' && (
        <TouchableOpacity
          style={styles.trackButton}

          onPress={() =>
            router.push({
              pathname: '/services/[id]/rate',

              params: {
                id: String(booking.id),
              },
            })
          }>
          <Text style={styles.trackText}>⭐ Rate Service</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    fontSize: 30,
    marginRight: 15,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
  },

  bookingCard: {
    backgroundColor: '#FFFFFF',
    margin: 18,
    padding: 18,
    borderRadius: 16,
  },

  bookingNumber: {
    fontSize: 14,
    color: '#6B7280',
  },

  serviceType: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },

  vendor: {
    marginTop: 10,
    color: '#374151',
  },

  timeline: {
    paddingHorizontal: 25,
  },

  step: {
    flexDirection: 'row',
    minHeight: 80,
  },

  circle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  circleActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },

  circleText: {
    color: '#6B7280',
    fontWeight: '900',
  },

  circleTextActive: {
    color: '#FFFFFF',
  },

  stepContent: {
    marginLeft: 15,
    flex: 1,
  },

  stepTitle: {
    fontWeight: '800',
    fontSize: 16,
  },

  activeText: {
    color: '#16A34A',
  },

  stepDescription: {
    color: '#6B7280',
    marginTop: 4,
  },

  trackButton: {
    marginHorizontal: 18,
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },

  trackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
