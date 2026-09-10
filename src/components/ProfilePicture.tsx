import React, { useState } from 'react';

import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { uploadProfilePicture } from '../api/profile';

type Props = {
  token: string;

  imageUrl?: string | null;

  onUploaded?: (imageUrl: string) => void;
};

export default function ProfilePicture({
  token,

  imageUrl,

  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false);

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access.');

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],

      allowsEditing: true,

      aspect: [1, 1],

      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    try {
      setUploading(true);

      const response = (await uploadProfilePicture(
        token,
        asset.uri,
        asset.mimeType || 'image/jpeg'
      )) as {
        data?: {
          profile_image_url?: string;
        };
      };

      const newUrl = response.data?.profile_image_url;

      if (newUrl) {
        onUploaded?.(newUrl);
      }

      Alert.alert('Success', 'Profile picture updated.');
    } catch (error: any) {
      Alert.alert('Upload failed', error.message || 'Unable to upload image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={chooseImage} disabled={uploading}>
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
            }}
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Add Photo</Text>
          </View>
        )}
      </Pressable>

      <Pressable onPress={chooseImage} disabled={uploading}>
        <Text style={styles.changeText}>
          {uploading ? 'Uploading...' : imageUrl ? 'Change picture' : 'Add profile picture'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',

    marginVertical: 20,
  },

  image: {
    width: 120,

    height: 120,

    borderRadius: 60,
  },

  placeholder: {
    width: 120,

    height: 120,

    borderRadius: 60,

    backgroundColor: '#E5E7EB',

    justifyContent: 'center',

    alignItems: 'center',
  },

  placeholderText: {
    color: '#6B7280',
  },

  changeText: {
    marginTop: 12,

    color: '#2563EB',

    fontWeight: '600',
  },
});
