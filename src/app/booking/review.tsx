import React, { useState, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { createBooking, uploadBookingMedia } from '../../api/bookings';
import { ServiceType } from '../../types/booking';

export default function ReviewBookingScreen() {
  const params = useLocalSearchParams<{
    service: string;
    pickupLatitude: string;
    pickupLongitude: string;
    destinationLatitude?: string;
    destinationLongitude?: string;
    problem?: string;
    media?: string;
  }>();

  // Safely parse media array from JSON param without risk of crashing
  const media = useMemo(() => {
    if (!params.media) return [];
    try {
      const parsed = JSON.parse(params.media);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.media]);

  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  function serviceName(service?: string) {
    if (!service) return 'N/A';
    switch (service) {
      case 'ride':
        return 'Ride';
      case 'mechanic':
        return 'Mechanic';
      case 'tow':
        return 'Tow';
      default:
        return service;
    }
  }

  async function confirmBooking() {
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    let bookingId: number;
    let bookingNumber: string;

    // Step 1: Create the main booking record
    try {
      setSubmitting(true);

      const response = await createBooking(token, {
        service_type: params.service as ServiceType,
        pickup_latitude: Number(params.pickupLatitude),
        pickup_longitude: Number(params.pickupLongitude),
        destination_latitude: params.destinationLatitude
          ? Number(params.destinationLatitude)
          : undefined,
        destination_longitude: params.destinationLongitude
          ? Number(params.destinationLongitude)
          : undefined,
        problem_description: params.problem || undefined,
      });

      bookingId = Number(response.data.id);
      bookingNumber = String(response.data.booking_number);
    } catch (error: any) {
      Alert.alert('Booking failed', error.message || 'Unable to create booking.');
      setSubmitting(false);
      return;
    }

    // Step 2: Pass bookingId as a NUMBER to uploadBookingMedia
    if (media.length > 0) {
      try {
        await Promise.all(media.map((file: any) => uploadBookingMedia(token, bookingId, file)));
      } catch (mediaError) {
        console.warn('Some media uploads failed:', mediaError);
      }
    }

    setSubmitting(false);

    // Step 3: Pass bookingId as a STRING to router.replace
    router.replace({
      pathname: './success',
      params: {
        bookingId: String(bookingId),
        bookingNumber,
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review Booking</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{serviceName(params.service)}</Text>

        {params.problem && (
          <>
            <Text style={styles.label}>Problem</Text>
            <Text style={styles.value}>{params.problem}</Text>
          </>
        )}

        {media.length > 0 && (
          <>
            <Text style={styles.label}>Attachments</Text>
            <Text style={styles.value}>{media.length} file(s) attached</Text>
          </>
        )}
      </View>

      <Pressable
        onPress={confirmBooking}
        disabled={submitting}
        style={[styles.button, submitting && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>
          {submitting ? 'Creating booking...' : 'Confirm Booking'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 15,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
