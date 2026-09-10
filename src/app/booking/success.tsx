import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

export default function BookingSuccessScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;

    bookingNumber: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✓</Text>

      <Text style={styles.title}>Booking Created</Text>

      <Text style={styles.message}>Your service request has been submitted successfully.</Text>

      <View style={styles.bookingCard}>
        <Text style={styles.bookingLabel}>Booking Number</Text>

        <Text style={styles.bookingNumber}>{params.bookingNumber}</Text>
      </View>

      <Pressable onPress={() => router.replace('/(customer)/activity')} style={styles.button}>
        <Text style={styles.buttonText}>View Booking</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/(customer)/home')} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Back Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    padding: 25,

    backgroundColor: '#FFFFFF',
  },

  icon: {
    width: 80,

    height: 80,

    borderRadius: 40,

    backgroundColor: '#DCFCE7',

    color: '#16A34A',

    textAlign: 'center',

    lineHeight: 80,

    fontSize: 40,

    fontWeight: '700',
  },

  title: {
    fontSize: 28,

    fontWeight: '700',

    marginTop: 20,
  },

  message: {
    textAlign: 'center',

    color: '#6B7280',

    marginTop: 10,

    lineHeight: 22,
  },

  bookingCard: {
    marginTop: 25,

    backgroundColor: '#F3F4F6',

    padding: 20,

    borderRadius: 12,

    width: '100%',

    alignItems: 'center',
  },

  bookingLabel: {
    color: '#6B7280',
  },

  bookingNumber: {
    fontSize: 18,

    fontWeight: '700',

    marginTop: 5,
  },

  button: {
    backgroundColor: '#2563EB',

    padding: 16,

    borderRadius: 12,

    width: '100%',

    alignItems: 'center',

    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',

    fontWeight: '700',
  },

  secondaryButton: {
    padding: 16,

    width: '100%',

    alignItems: 'center',
  },

  secondaryText: {
    color: '#2563EB',

    fontWeight: '600',
  },
});
