import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';

import { useEffect, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';

import { api } from '../../../api/client';

import { getBooking } from '../../../api/bookings';

import { useAuthStore } from '../../../store/authStore';

import { startVendorTracking, stopVendorTracking } from '../../../location/vendorLocation';

const NEXT_STATUS: Record<
  string,
  {
    status: string;
    label: string;
  } | null
> = {
  accepted: {
    status: 'en_route',

    label: 'Start Driving',
  },

  en_route: {
    status: 'arrived',

    label: "I've Arrived",
  },

  arrived: {
    status: 'in_progress',

    label: 'Start Service',
  },

  in_progress: {
    status: 'completed',

    label: 'Complete Service',
  },

  pending: null,

  searching: null,

  completed: null,

  cancelled: null,
};

export default function VendorJobScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function loadBooking() {
    try {
      const response = await getBooking(Number(id), token!);

      if (response.success) {
        setBooking(response.booking);
      }
    } catch {
      Alert.alert('Error', 'Unable to load booking.');
    }
  }

  async function changeStatus() {
    if (!booking) {
      return;
    }

    const next = NEXT_STATUS[booking.status];

    if (!next) {
      return;
    }

    if (next.status === 'en_route') {
      await startVendorTracking(token!);
    }

    if (next.status === 'completed') {
      await stopVendorTracking();
    }

    try {
      const response = await api.post(
        `/vendor/bookings/${booking.id}/status`,

        {
          status: next.status,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        await loadBooking();
      } else {
        Alert.alert('Unable to update', response.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        'Unable to update',

        error.response?.data?.message ?? 'Please try again.'
      );
    }
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const next = NEXT_STATUS[booking.status];

  return (
    <ScrollView
      style={styles.container}

      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Job #{booking.booking_number}</Text>

      <View style={styles.card}>
        <Text style={styles.status}>{booking.status}</Text>

        <Text style={styles.service}>{booking.service_type}</Text>

        {booking.customer_name && (
          <Text style={styles.customer}>Customer: {booking.customer_name}</Text>
        )}

        {booking.problem_description && (
          <View style={styles.section}>
            <Text style={styles.heading}>Problem</Text>

            <Text style={styles.body}>{booking.problem_description}</Text>
          </View>
        )}

        {booking.pickup_address && (
          <View style={styles.section}>
            <Text style={styles.heading}>Location</Text>

            <Text style={styles.body}>📍 {booking.pickup_address}</Text>
          </View>
        )}
      </View>

      {next && (
        <TouchableOpacity
          style={styles.primaryButton}

          onPress={changeStatus}>
          <Text style={styles.primaryText}>{next.label}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.chatButton}

        onPress={() =>
          router.push({
            pathname: '/services/[id]/chat',

            params: {
              id: String(booking.id),
            },
          })
        }>
        <Text style={styles.chatText}>💬 Chat with Customer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },

  status: {
    color: '#16A34A',
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  service: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },

  customer: {
    marginTop: 10,
    color: '#4B5563',
  },

  section: {
    marginTop: 20,
  },

  heading: {
    fontWeight: '900',
    marginBottom: 5,
  },

  body: {
    color: '#4B5563',
    lineHeight: 20,
  },

  primaryButton: {
    marginTop: 20,
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  chatButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },

  chatText: {
    color: '#16A34A',
    fontWeight: '900',
  },
});
