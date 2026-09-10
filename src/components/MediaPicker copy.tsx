import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ScrollView } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { useState } from 'react';

export type SelectedMedia = {
  uri: string;
  type: 'image' | 'video';
  name: string;
  mimeType?: string;
  size?: number;
};

type Props = {
  onChange: (media: SelectedMedia[]) => void;
};

export default function MediaPicker({ onChange }: Props) {
  const [media, setMedia] = useState<SelectedMedia[]>([]);

  async function chooseMedia() {
    if (media.length >= 5) {
      Alert.alert('Maximum reached', 'You can attach up to 5 files.');

      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access in your device settings.'
      );

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],

      allowsMultipleSelection: true,

      selectionLimit: 5 - media.length,

      quality: 0.8,
    });

    if (result.canceled || !result.assets) {
      return;
    }

    const selected: SelectedMedia[] = result.assets.map((asset, index) => {
      const type = asset.type === 'video' ? 'video' : 'image';
      //   const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';

      return {
        uri: asset.uri,

        type,

        name: asset.fileName ?? `media_${Date.now()}_${index}`,

        mimeType: asset.mimeType,

        size: asset.fileSize,
      };
    });

    /*
    const selected = result.assets.map((asset, index) => ({
  uri: asset.uri,
  type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
  name: asset.fileName ?? `media_${Date.now()}_${index}`,
  mimeType: asset.mimeType,
  size: asset.fileSize,
})); 
     */

    const updated = [...media, ...selected].slice(0, 5);

    setMedia(updated);

    onChange(updated);
  }

  function removeMedia(index: number) {
    const updated = media.filter((_, i) => i !== index);

    setMedia(updated);

    onChange(updated);
  }

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={chooseMedia}>
        <Text style={styles.buttonText}>📷 Add photos / video</Text>
      </TouchableOpacity>

      {media.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preview}>
          {media.map((item, index) => (
            <View key={item.uri} style={styles.item}>
              {item.type === 'image' ? (
                <Image
                  source={{
                    uri: item.uri,
                  }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.video}>
                  <Text style={styles.videoText}>🎥</Text>
                </View>
              )}

              <TouchableOpacity style={styles.remove} onPress={() => removeMedia(index)}>
                <Text>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 15,
    padding: 17,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },

  buttonText: {
    fontWeight: '700',
    color: '#374151',
  },

  preview: {
    marginTop: 15,
  },

  item: {
    width: 100,
    height: 100,
    marginRight: 10,
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  video: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoText: {
    fontSize: 35,
  },

  remove: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 25,
    height: 25,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
