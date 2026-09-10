import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type ServiceType = 'ride' | 'mechanic' | 'tow';

export default function BookServiceScreen() {
  const { type } = useLocalSearchParams<{
    type?: ServiceType;
  }>();

  const serviceType: ServiceType =
    type === 'mechanic' ? 'mechanic' : type === 'tow' ? 'tow' : 'ride';

  const token = useAuthStore((state) => state.token);

  const [pickup, setPickup] = useState('');

  const [destination, setDestination] = useState('');

  const [problem, setProblem] = useState('');

  const [loading, setLoading] = useState(false);

  const title =
    serviceType === 'ride'
      ? 'Book a Ride'
      : serviceType === 'mechanic'
        ? 'Request a Mechanic'
        : 'Request a Tow';

  async function submit() {
    if (!pickup.trim()) {
      Alert.alert('Pickup required', 'Please enter your pickup location.');

      return;
    }

    if ((serviceType === 'ride' || serviceType === 'tow') && !destination.trim()) {
      Alert.alert('Destination required', 'Please enter your destination.');

      return;
    }

    if (serviceType === 'mechanic' && !problem.trim()) {
      Alert.alert('Problem required', 'Please describe the vehicle problem.');

      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        '',

        {
          service_type: serviceType,

          pickup_address: pickup.trim(),

          destination_address: destination.trim(),

          problem_description: problem.trim(),
        },

        {
          params: {
            path: 'bookings',
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const booking = response.data.booking;

        router.replace({
          pathname: '/services/[id]',

          params: {
            id: String(booking.id),
          },
        });
      } else {
        Alert.alert('Booking failed', response.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        'Booking failed',

        error.response?.data?.message ?? 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Pickup Location</Text>

        <TextInput
          value={pickup}

          onChangeText={setPickup}

          placeholder={'Where should the vendor come?'}

          style={styles.input}
        />

        {(serviceType === 'ride' || serviceType === 'tow') && (
          <>
            <Text style={styles.label}>Destination</Text>

            <TextInput
              value={destination}

              onChangeText={setDestination}

              placeholder={'Where are you going?'}

              style={styles.input}
            />
          </>
        )}

        {serviceType === 'mechanic' && (
          <>
            <Text style={styles.label}>Describe the problem</Text>

            <TextInput
              value={problem}

              onChangeText={setProblem}

              placeholder={"Example: My vehicle won't start..."}

              multiline

              textAlignVertical={'top'}

              style={[styles.input, styles.textarea]}
            />

            <TouchableOpacity
              style={styles.upload}

              onPress={() =>
                Alert.alert('Coming next', 'Photo and video upload will be added in the next step.')
              }>
              <Text style={styles.uploadText}>📷 Add Photos / Videos</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.info}>
          <Text style={styles.infoTitle}>How it works</Text>

          <Text style={styles.infoText}>1. Submit your request</Text>

          <Text style={styles.infoText}>2. A nearby vendor accepts</Text>

          <Text style={styles.infoText}>3. Track the vendor</Text>

          <Text style={styles.infoText}>4. Complete the service</Text>
        </View>

        <TouchableOpacity
          style={styles.button}

          disabled={loading}

          onPress={submit}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Request Service</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    fontSize: 30,
    marginRight: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  label: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    marginBottom: 12,
  },

  textarea: {
    minHeight: 130,
  },

  upload: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },

  uploadText: {
    color: '#16A34A',
    fontWeight: '800',
  },

  info: {
    backgroundColor: '#ECFDF5',
    padding: 17,
    borderRadius: 14,
    marginTop: 20,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },

  infoText: {
    color: '#374151',
    marginBottom: 4,
  },

  button: {
    marginTop: 22,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 17,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
