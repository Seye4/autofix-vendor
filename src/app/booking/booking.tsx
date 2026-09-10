import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { ServiceType } from '../../types/booking';

type ServiceOption = {
  type: ServiceType;

  title: string;

  description: string;

  icon: string;
};

const services: ServiceOption[] = [
  {
    type: 'ride',

    title: 'Book a Ride',

    description: 'Get a driver to take you to your destination.',

    icon: '🚗',
  },

  {
    type: 'mechanic',

    title: 'Find a Mechanic',

    description: 'Get help with a vehicle problem.',

    icon: '🔧',
  },

  {
    type: 'tow',

    title: 'Request a Tow',

    description: 'Get your vehicle towed to a location.',

    icon: '🚚',
  },
];

export default function BookingScreen() {
  function selectService(service: ServiceType) {
    router.push({
      pathname: './location',

      params: {
        service,
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you need?</Text>

      <Text style={styles.subtitle}>Select a service to continue.</Text>

      {services.map((service) => (
        <Pressable
          key={service.type}
          onPress={() => selectService(service.type)}
          style={styles.card}>
          <Text style={styles.icon}>{service.icon}</Text>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{service.title}</Text>

            <Text style={styles.cardDescription}>{service.description}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    padding: 20,

    backgroundColor: '#F9FAFB',
  },

  title: {
    fontSize: 28,

    fontWeight: '700',

    marginTop: 20,
  },

  subtitle: {
    color: '#6B7280',

    marginTop: 8,

    marginBottom: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    padding: 20,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 15,

    borderWidth: 1,

    borderColor: '#E5E7EB',
  },

  icon: {
    fontSize: 40,

    marginRight: 18,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,

    fontWeight: '700',
  },

  cardDescription: {
    color: '#6B7280',

    marginTop: 5,

    lineHeight: 20,
  },
});
