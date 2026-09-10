import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

import { useAuthStore } from '../../store/authStore';
import MediaPicker from '../../components/MediaPicker';
import LocationPicker from '../../components/LocationPicker';
import { uploadBookingMedia } from '../../api/media';
import { createBooking as createBookingApi } from '../../api/bookings';

export default function MechanicBookingScreen() {
  const token = useAuthStore((state) => state.token);

  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceLocation, setServiceLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  async function handleCreateBooking() {
    if (description.trim().length < 10) {
      Alert.alert('Describe the problem', 'Please provide at least 10 characters.');
      return;
    }

    if (!serviceLocation) {
      Alert.alert('Select location', 'Please select where the mechanic should come.');
      return;
    }

    try {
      setLoading(true);

      const response = await createBookingApi(
        {
          service_type: 'mechanic',
          problem_description: description,
          pickup_address: 'Selected location',
          pickup_latitude: serviceLocation.latitude,
          pickup_longitude: serviceLocation.longitude,
        },
        token!
      );

      if (!response.success) {
        Alert.alert('Error', response.message);
        return;
      }

      const bookingId = response.booking.id;

      /*
       * Upload attachments.
       */
      for (const asset of media) {
        await uploadBookingMedia(bookingId, asset, token!);
      }

      router.replace({
        pathname: '/services/[id]',
        params: {
          id: String(bookingId),
        },
      });
    } catch (error: any) {
      Alert.alert(
        'Unable to create booking',
        error.response?.data?.message ?? error.message ?? 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Book a Mechanic</Text>

      <Text style={styles.subtitle}>Tell the mechanic what is wrong with your vehicle.</Text>

      <Text style={styles.label}>Describe the problem</Text>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={
          "Example: My vehicle won't start. " + 'I hear a clicking sound when I turn the key.'
        }
        multiline
        textAlignVertical="top"
        style={styles.textArea}
      />

      <LocationPicker value={serviceLocation} onChange={setServiceLocation} />

      <MediaPicker
        onSelected={(asset) => {
          if (media.length >= 5) {
            Alert.alert('Maximum reached', 'You can upload up to 5 files.');
            return;
          }

          setMedia((previous) => [...previous, asset]);
        }}
      />

      {media.length > 0 && (
        <View style={styles.mediaContainer}>
          <Text style={styles.label}>Selected files</Text>

          <ScrollView horizontal>
            {media.map((asset, index) => (
              <View key={index} style={styles.mediaItem}>
                {asset.type === 'video' ? (
                  <View style={styles.video}>
                    <Text style={styles.videoText}>🎥</Text>
                  </View>
                ) : (
                  <Image
                    source={{
                      uri: asset.uri,
                    }}
                    style={styles.image}
                  />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleCreateBooking} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Request Mechanic'}</Text>
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
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#6B7280',
    marginTop: 7,
    lineHeight: 20,
  },

  label: {
    fontWeight: '900',
    marginTop: 25,
    marginBottom: 9,
  },

  textArea: {
    minHeight: 150,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
  },

  mediaContainer: {
    marginTop: 15,
  },

  mediaItem: {
    marginRight: 10,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },

  video: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoText: {
    fontSize: 35,
  },

  button: {
    backgroundColor: '#16A34A',
    borderRadius: 13,
    padding: 17,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});
