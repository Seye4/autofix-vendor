import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';

export type SelectedLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

type Props = {
  value?: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
};

export default function LocationPicker({ value, onChange }: Props) {
  const [location, setLocation] = useState<SelectedLocation | null>(value ?? null);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  async function loadCurrentLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location required',
          'Please allow location access so we can determine your service location.'
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLocation: SelectedLocation = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        address: 'Current Location',
      };

      setLocation(currentLocation);
      onChange(currentLocation);
    } catch {
      Alert.alert('Location error', 'Unable to determine your current location.');
    }
  }

  function selectLocation(event: MapPressEvent) {
    const selected: SelectedLocation = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
      address: 'Selected map pin',
    };

    setLocation(selected);
    onChange(selected);
  }

  const initialRegion = {
    latitude: location?.latitude ?? 49.8951,
    longitude: location?.longitude ?? -97.1384,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where should the service happen?</Text>
      <Text style={styles.description}>Tap the map to select the exact location.</Text>

      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={selectLocation}
        showsUserLocation
        showsMyLocationButton>
        {location && (
          <Marker
            coordinate={location}
            title="Service location"
            description="Selected service location"
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.currentButton} onPress={loadCurrentLocation}>
        <Text style={styles.currentText}>📍 Use my current location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
  },
  description: {
    color: '#6B7280',
    marginTop: 5,
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 15,
  },
  currentButton: {
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  currentText: {
    color: '#166534',
    fontWeight: '900',
  },
});
