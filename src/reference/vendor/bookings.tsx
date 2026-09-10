import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

import { useEffect, useState } from 'react';

import { router } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type Booking = {
  id: number;

  booking_number: string;

  service_type: string;

  status: string;

  pickup_address?: string;

  problem_description?: string;

  customer_name?: string;

  estimated_price?: number;
};

export default function VendorBookingsScreen() {
  const token = useAuthStore((state) => state.token);

  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();

    const interval = setInterval(loadBookings, 5000);

    return () => clearInterval(interval);
  }, []);

  async function loadBookings() {
    try {
      const response = await api.get('', {
        params: {
          path: 'vendor/bookings',
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch {
      // Temporary network error.
    }
  }

  async function acceptBooking(bookingId: number) {
    try {
      const response = await api.post(
        '',
        {},

        {
          params: {
            path: `vendor/bookings/${bookingId}/accept`,
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Booking accepted', 'You have accepted this service request.');

        loadBookings();
      }
    } catch (error: any) {
      Alert.alert(
        'Unable to accept',
        error.response?.data?.message ?? 'This booking may already have been accepted.'
      );
    }
  }

  function renderBooking({ item }: { item: Booking }) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.bookingNumber}>#{item.booking_number}</Text>

          <Text style={styles.status}>{item.status}</Text>
        </View>

        <Text style={styles.service}>{item.service_type}</Text>

        {item.customer_name && <Text style={styles.customer}>Customer: {item.customer_name}</Text>}

        {item.problem_description && (
          <Text style={styles.description}>{item.problem_description}</Text>
        )}

        {item.pickup_address && <Text style={styles.location}>📍 {item.pickup_address}</Text>}

        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.acceptButton}

            onPress={() => acceptBooking(item.id)}>
            <Text style={styles.acceptText}>Accept Request</Text>
          </TouchableOpacity>
        )}

        {item.status !== 'pending' && (
          <TouchableOpacity
            style={styles.viewButton}

            onPress={() =>
              router.push({
                pathname: '/vendor/job/[id]',

                params: {
                  id: String(item.id),
                },
              })
            }>
            <Text style={styles.viewText}>View Job</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Requests</Text>

      <FlatList
        data={bookings}

        keyExtractor={(item) => String(item.id)}

        renderItem={renderBooking}

        contentContainerStyle={styles.list}

        ListEmptyComponent={<Text style={styles.empty}>No service requests yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  list: {
    padding: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  bookingNumber: {
    color: '#6B7280',
    fontWeight: '800',
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
    marginTop: 7,
    color: '#374151',
  },

  description: {
    marginTop: 12,
    color: '#4B5563',
    lineHeight: 20,
  },

  location: {
    marginTop: 12,
    color: '#374151',
  },

  acceptButton: {
    marginTop: 15,
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  acceptText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  viewButton: {
    marginTop: 15,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  viewText: {
    color: '#166534',
    fontWeight: '900',
  },

  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 50,
  },
});
