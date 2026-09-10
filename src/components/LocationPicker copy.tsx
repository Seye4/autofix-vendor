import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import * as Location from 'expo-location';

import { useState } from 'react';

export type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

type Props = {
  value?: SelectedLocation | null;

  onChange: (location: SelectedLocation) => void;
};

export default function LocationPicker({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);

  async function getCurrentLocation() {
    try {
      setLoading(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location permission',
          'Please allow location access to use your current location.'
        );

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude;

      const longitude = location.coords.longitude;

      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const place = addresses[0];

      const address = [place?.name, place?.street, place?.city, place?.region, place?.postalCode]
        .filter(Boolean)
        .join(', ');

      const selected = {
        latitude,

        longitude,

        address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };

      onChange(selected);
    } catch (error) {
      Alert.alert('Location error', "We couldn't determine your current location.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={getCurrentLocation} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Finding location...' : '📍 Use my current location'}
        </Text>
      </TouchableOpacity>

      {value && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Pickup location</Text>

          <Text style={styles.address}>{value.address}</Text>

          <Text style={styles.coordinates}>
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 15,
    padding: 17,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#166534',
    fontWeight: '700',
  },

  result: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },

  resultTitle: {
    fontWeight: '800',
    fontSize: 15,
  },

  address: {
    marginTop: 6,
    color: '#374151',
    lineHeight: 21,
  },

  coordinates: {
    marginTop: 5,
    color: '#9CA3AF',
    fontSize: 12,
  },
});
