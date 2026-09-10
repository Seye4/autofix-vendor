import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { Booking, cancelBooking, getBooking } from '../../api/bookings';

import { getBookingStatusLabel } from '../../constants/bookingStatus';

import { useAuth } from '../../context/AuthContext';

export default function BookingViewScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;
  }>();

  const { token } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, []);

  async function loadBooking() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);

      const response = await getBooking(token, Number(params.bookingId));

      setBooking(response.data.booking);
    } catch (error) {
      Alert.alert('Error', 'Unable to load booking.');

      router.back();
    } finally {
      setLoading(false);
    }
  }

  function canCancel() {
    if (!booking) {
      return false;
    }

    return ['searching', 'accepted', 'arriving'].includes(booking.status);
  }

  function confirmCancel() {
    Alert.alert(
      'Cancel booking',

      'Are you sure you want to cancel this booking?',

      [
        {
          text: 'No',

          style: 'cancel',
        },

        {
          text: 'Yes, cancel',

          style: 'destructive',

          onPress: performCancel,
        },
      ]
    );
  }

  async function performCancel() {
    if (!token || !booking) {
      return;
    }

    try {
      setCancelling(true);

      await cancelBooking(
        token,

        booking.id,

        'Cancelled by customer'
      );

      Alert.alert('Booking cancelled', 'Your booking has been cancelled.');

      await loadBooking();
    } catch (error: any) {
      Alert.alert('Unable to cancel', error.message || 'Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  function openTracking() {
    if (!booking) {
      return;
    }

    router.push({
      pathname: '/(customer)/booking/progress',

      params: {
        bookingId: booking.id.toString(),
      },
    });
  }

  function openChat() {
    if (!booking) {
      return;
    }

    router.push({
      pathname: '/(customer)/chat',

      params: {
        bookingId: booking.id.toString(),

        vendorId: booking.vendor_id?.toString() || '',
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!booking) {
    return null;
  }

  const isActive = ['searching', 'accepted', 'arriving', 'arrived', 'in_progress'].includes(
    booking.status
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Booking Details</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current status</Text>

        <Text style={styles.status}>{getBookingStatusLabel(booking.status)}</Text>

        <Text style={styles.bookingNumber}>#{booking.booking_number}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service</Text>

        <Text style={styles.value}>
          {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pickup</Text>

        <Text style={styles.value}>
          {booking.pickup_address || `${booking.pickup_latitude}, ${booking.pickup_longitude}`}
        </Text>

        {booking.destination_latitude && (
          <>
            <Text style={styles.sectionTitle}>Destination</Text>

            <Text style={styles.value}>
              {booking.destination_address ||
                `${booking.destination_latitude}, ${booking.destination_longitude}`}
            </Text>
          </>
        )}
      </View>

      {booking.vendor_name && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Provider</Text>

          <Text style={styles.value}>{booking.vendor_name}</Text>

          {booking.vendor_phone && <Text style={styles.phone}>{booking.vendor_phone}</Text>}
        </View>
      )}

      {booking.problem_description && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Problem</Text>

          <Text style={styles.value}>{booking.problem_description}</Text>
        </View>
      )}

      {isActive && (
        <Pressable onPress={openTracking} style={styles.primaryButton}>
          <Text style={styles.primaryText}>View Service Progress</Text>
        </Pressable>
      )}

      {booking.vendor_id && isActive && (
        <Pressable onPress={openChat} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>💬 Chat with Provider</Text>
        </Pressable>
      )}

      {canCancel() && (
        <Pressable onPress={confirmCancel} disabled={cancelling} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,

    backgroundColor: '#F9FAFB',

    flexGrow: 1,
  },

  center: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',
  },

  title: {
    fontSize: 28,

    fontWeight: '700',

    marginBottom: 20,
  },

  statusCard: {
    backgroundColor: '#2563EB',

    padding: 20,

    borderRadius: 16,

    marginBottom: 15,
  },

  statusLabel: {
    color: '#DBEAFE',
  },

  status: {
    color: '#FFFFFF',

    fontSize: 20,

    fontWeight: '700',

    marginTop: 5,
  },

  bookingNumber: {
    color: '#DBEAFE',

    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',

    padding: 17,

    borderRadius: 14,

    marginBottom: 12,

    borderWidth: 1,

    borderColor: '#E5E7EB',
  },

  sectionTitle: {
    color: '#6B7280',

    fontSize: 13,

    fontWeight: '600',

    marginBottom: 5,
  },

  value: {
    fontSize: 16,

    color: '#111827',

    marginBottom: 12,
  },

  phone: {
    color: '#2563EB',

    fontWeight: '600',
  },

  primaryButton: {
    backgroundColor: '#2563EB',

    padding: 16,

    borderRadius: 12,

    alignItems: 'center',

    marginTop: 10,
  },

  primaryText: {
    color: '#FFFFFF',

    fontWeight: '700',

    fontSize: 16,
  },

  secondaryButton: {
    borderWidth: 1,

    borderColor: '#2563EB',

    padding: 15,

    borderRadius: 12,

    alignItems: 'center',

    marginTop: 10,
  },

  secondaryText: {
    color: '#2563EB',

    fontWeight: '700',
  },

  cancelButton: {
    padding: 15,

    alignItems: 'center',

    marginTop: 10,
  },

  cancelText: {
    color: '#DC2626',

    fontWeight: '700',
  },
});
