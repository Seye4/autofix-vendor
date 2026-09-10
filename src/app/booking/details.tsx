import React, { useState } from 'react';

import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import ProblemMediaPicker, { SelectedMedia } from '../../components/booking/ProblemMediaPicker';

export default function DetailsScreen() {
  const params = useLocalSearchParams<{
    service: string;

    pickupLatitude: string;

    pickupLongitude: string;

    destinationLatitude?: string;

    destinationLongitude?: string;
  }>();

  const [problem, setProblem] = useState('');

  const [media, setMedia] = useState<SelectedMedia[]>([]);

  function continueBooking() {
    if (params.service === 'mechanic' && !problem.trim()) {
      Alert.alert(
        'Problem description required',
        'Please describe what is wrong with your vehicle.'
      );

      return;
    }

    router.push({
      pathname: './review',

      params: {
        service: params.service,

        pickupLatitude: params.pickupLatitude,

        pickupLongitude: params.pickupLongitude,

        destinationLatitude: params.destinationLatitude || '',

        destinationLongitude: params.destinationLongitude || '',

        problem: problem.trim(),

        media: JSON.stringify(media),
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Service Details</Text>

      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 Pickup location selected</Text>

        <Text style={styles.coordinates}>
          {params.pickupLatitude}, {params.pickupLongitude}
        </Text>
      </View>

      {params.service === 'ride' && (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>🟢 Destination selected</Text>

          <Text style={styles.coordinates}>
            {params.destinationLatitude}, {params.destinationLongitude}
          </Text>
        </View>
      )}

      {params.service === 'tow' && (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>🟢 Tow destination selected</Text>

          <Text style={styles.coordinates}>
            {params.destinationLatitude}, {params.destinationLongitude}
          </Text>
        </View>
      )}

      {params.service === 'mechanic' && (
        <>
          <Text style={styles.label}>Describe the problem</Text>

          <Text style={styles.help}>Tell the mechanic what is happening with your vehicle.</Text>

          <TextInput
            value={problem}
            onChangeText={setProblem}
            placeholder="Example: The engine starts but stops after a few seconds..."
            multiline
            textAlignVertical="top"
            style={styles.textarea}
          />

          <Text style={styles.mediaHint}>Next we'll add photos and videos of the problem.</Text>

          <ProblemMediaPicker media={media} onChange={setMedia} />
        </>
      )}

      <Pressable onPress={continueBooking} style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,

    flexGrow: 1,

    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 28,

    fontWeight: '700',

    marginTop: 20,

    marginBottom: 25,
  },

  locationCard: {
    backgroundColor: '#F3F4F6',

    borderRadius: 12,

    padding: 15,

    marginBottom: 12,
  },

  locationTitle: {
    fontWeight: '700',
  },

  coordinates: {
    color: '#6B7280',

    marginTop: 5,
  },

  label: {
    fontWeight: '700',

    fontSize: 17,

    marginTop: 15,
  },

  help: {
    color: '#6B7280',

    marginTop: 6,

    marginBottom: 12,
  },

  textarea: {
    borderWidth: 1,

    borderColor: '#D1D5DB',

    borderRadius: 12,

    minHeight: 150,

    padding: 15,

    fontSize: 16,
  },

  mediaHint: {
    color: '#6B7280',

    marginTop: 12,
  },

  button: {
    backgroundColor: '#2563EB',

    padding: 16,

    borderRadius: 12,

    alignItems: 'center',

    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',

    fontWeight: '700',

    fontSize: 16,
  },
});
