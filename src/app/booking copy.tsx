import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import MediaPicker from '../components/MediaPicker';
import LocationPicker, { SelectedLocation } from '../components/LocationPicker';

export default function BookingScreen() {
  const { service } = useLocalSearchParams<{
    service?: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const [problem, setProblem] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [location, setLocation] = useState<SelectedLocation | null>(null);

  const serviceType = service === 'tow' ? 'tow' : service === 'ride' ? 'ride' : 'mechanic';

  async function submitBooking() {
    if (!pickup) {
      Alert.alert('Location required', 'Please enter your pickup location.');
      return;
    }

    if (serviceType === 'mechanic' && !problem) {
      Alert.alert('Describe the problem', 'Please describe the vehicle problem.');
      return;
    }

    if (!location) {
      Alert.alert('Location required', 'Please select your current location.');
      return;
    }

    try {
      setLoading(true);

      // FIX 1: Send request directly to '/bookings'
      const response = await api.post(
        '/bookings',
        {
          service_type: serviceType,
          problem_description: problem,
          pickup_address: location.address,
          pickup_latitude: location.latitude,
          pickup_longitude: location.longitude,
          destination_address: destination,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const bookingId = response.data.booking.id;

      if (media.length > 0) {
        await uploadBookingMedia(bookingId);
      }

      Alert.alert(
        'Booking created',
        `Booking ${response.data.booking.booking_number} has been created.`,
        [
          {
            text: 'View Activity',
            onPress: () => router.replace('/(protected)/activity'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Booking failed',
        error.response?.data?.message ?? error.message ?? 'Unable to create booking'
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadBookingMedia(bookingId: number) {
    for (const item of media) {
      const formData = new FormData();

      const fileName = item.fileName ?? item.uri.split('/').pop() ?? 'upload';
      const fileType = item.mimeType ?? (item.type === 'video' ? 'video/mp4' : 'image/jpeg');

      formData.append('booking_id', String(bookingId));
      formData.append('file', {
        uri: item.uri,
        name: fileName,
        type: fileType,
      } as any);

      // FIX 2: Send request directly to '/bookings/media'
      await api.post('/bookings/media', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      });
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Book {serviceType}</Text>

      <Text style={styles.label}>Pickup location</Text>

      <TextInput
        style={styles.input}
        placeholder="Where should we pick you up?"
        value={pickup}
        onChangeText={setPickup}
      />

      {serviceType === 'ride' && (
        <>
          <Text style={styles.label}>Destination</Text>
          <TextInput
            style={styles.input}
            placeholder="Where are you going?"
            value={destination}
            onChangeText={setDestination}
          />
        </>
      )}

      {serviceType === 'mechanic' && (
        <>
          <Text style={styles.label}>What's wrong?</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the problem with your vehicle..."
            value={problem}
            onChangeText={setProblem}
            multiline
            textAlignVertical="top"
          />
        </>
      )}

      {serviceType === 'tow' && (
        <>
          <Text style={styles.label}>Destination</Text>
          <TextInput
            style={styles.input}
            placeholder="Where should the vehicle be towed?"
            value={destination}
            onChangeText={setDestination}
          />
        </>
      )}

      <LocationPicker value={location} onChange={setLocation} />

      {serviceType === 'mechanic' && (
        <>
          <MediaPicker
            onSelected={(asset) => {
              if (media.length >= 5) {
                Alert.alert('Maximum reached', 'You can upload up to 5 files.');
                return;
              }
              setMedia((prev) => [...prev, asset]);
            }}
          />

          {media.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.label}>Selected files ({media.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {media.map((asset) => (
                  // FIX 3: Use asset.uri as unique key instead of index
                  <View key={asset.uri} style={styles.mediaItem}>
                    {asset.type === 'video' ? (
                      <View style={styles.videoPlaceholder}>
                        <Text style={{ fontSize: 24 }}>🎥</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: asset.uri }} style={styles.mediaImage} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={submitBooking} disabled={loading}>
        <Text style={styles.submitText}>{loading ? 'Booking...' : 'Request Service'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 22,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 40,
    marginBottom: 30,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textarea: {
    minHeight: 140,
  },
  mediaPreviewContainer: {
    marginTop: 10,
  },
  mediaItem: {
    marginRight: 10,
  },
  mediaImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 30,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});
