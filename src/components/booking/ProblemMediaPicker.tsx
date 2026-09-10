import React, { useState } from 'react';

import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

export type SelectedMedia = {
  uri: string;

  type: 'image' | 'video';

  name: string;
};

type Props = {
  media: SelectedMedia[];

  onChange: (media: SelectedMedia[]) => void;
};

export default function ProblemMediaPicker({ media, onChange }: Props) {
  const [opening, setOpening] = useState(false);

  async function chooseMedia() {
    try {
      setOpening(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos and videos.');

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],

        allowsMultipleSelection: true,

        selectionLimit: 5,

        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const selected: SelectedMedia[] = result.assets.map((asset, index) => ({
        uri: asset.uri,

        type: asset.type === 'video' ? 'video' : 'image',

        name: asset.fileName || `media-${Date.now()}-${index}`,
      }));

      onChange([...media, ...selected].slice(0, 5));
    } catch {
      Alert.alert('Media error', 'Unable to select media.');
    } finally {
      setOpening(false);
    }
  }

  function removeMedia(index: number) {
    onChange(media.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={chooseMedia} disabled={opening} style={styles.addButton}>
        <Text style={styles.addButtonText}>
          {opening ? 'Opening...' : '📷 Add Photos / Videos'}
        </Text>
      </Pressable>

      <Text style={styles.limit}>You can upload up to 5 files.</Text>

      {media.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewList}>
          {media.map((item, index) => (
            <View key={`${item.uri}-${index}`} style={styles.previewContainer}>
              {item.type === 'image' ? (
                <Image
                  source={{
                    uri: item.uri,
                  }}
                  style={styles.preview}
                />
              ) : (
                <View style={styles.videoPreview}>
                  <Text style={styles.videoIcon}>▶</Text>

                  <Text>Video</Text>
                </View>
              )}

              <Pressable onPress={() => removeMedia(index)} style={styles.remove}>
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  addButton: {
    borderWidth: 1,

    borderColor: '#2563EB',

    borderRadius: 12,

    padding: 15,

    alignItems: 'center',
  },

  addButtonText: {
    color: '#2563EB',

    fontWeight: '700',
  },

  limit: {
    color: '#6B7280',

    fontSize: 12,

    marginTop: 7,
  },

  previewList: {
    marginTop: 15,
  },

  previewContainer: {
    marginRight: 12,

    position: 'relative',
  },

  preview: {
    width: 100,

    height: 100,

    borderRadius: 10,
  },

  videoPreview: {
    width: 100,

    height: 100,

    borderRadius: 10,

    backgroundColor: '#E5E7EB',

    justifyContent: 'center',

    alignItems: 'center',
  },

  videoIcon: {
    fontSize: 25,

    marginBottom: 5,
  },

  remove: {
    position: 'absolute',

    right: -5,

    top: -5,

    width: 26,

    height: 26,

    borderRadius: 13,

    backgroundColor: '#DC2626',

    alignItems: 'center',

    justifyContent: 'center',
  },

  removeText: {
    color: '#FFFFFF',

    fontSize: 20,

    lineHeight: 23,
  },
});
