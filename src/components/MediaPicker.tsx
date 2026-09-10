import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useState } from 'react';

import * as ImagePicker from 'expo-image-picker';

type Props = {
  onSelected: (asset: ImagePicker.ImagePickerAsset) => void;
};

export default function MediaPicker({ onSelected }: Props) {
  const [loading, setLoading] = useState(false);

  async function choosePhoto() {
    try {
      setLoading(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos.');

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],

        allowsEditing: true,

        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      onSelected(result.assets[0]);
    } catch {
      Alert.alert('Error', 'Unable to select photo.');
    } finally {
      setLoading(false);
    }
  }

  async function chooseVideo() {
    try {
      setLoading(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your videos.');

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],

        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      onSelected(result.assets[0]);
    } catch {
      Alert.alert('Error', 'Unable to select video.');
    } finally {
      setLoading(false);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera permission is required.');

      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],

      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    onSelected(result.assets[0]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add photos or video</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={takePhoto} disabled={loading}>
          <Text style={styles.buttonText}>📷 Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={choosePhoto} disabled={loading}>
          <Text style={styles.buttonText}>🖼 Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={chooseVideo} disabled={loading}>
          <Text style={styles.buttonText}>🎥 Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  title: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },

  buttons: {
    flexDirection: 'row',
    gap: 8,
  },

  button: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 10,
  },

  buttonText: {
    color: '#166534',
    fontWeight: '800',
  },
});
