import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';

const MediaRenderer = ({ media }) => {
  if (!media || !media.type) return null;

  /* =========================
     IMAGE
  ========================= */
  if (media.type === 'image') {
    const uri =
      media.variants?.medium ||
      media.variants?.original ||
      null;

    if (!uri) return null;

    return (
      <Image
        source={{ uri }}
        style={styles.media}
        resizeMode="cover"
      />
    );
  }

  /* =========================
     VIDEO
  ========================= */
  if (media.type === 'video') {
    const uri =
      media.variants?.video_720p ||
      media.variants?.original ||
      null;

    if (!uri) return null;

    return (
      <Video
        source={{ uri }}
        style={styles.media}
        resizeMode="cover"
        shouldPlay={false}
        isLooping={false}
        useNativeControls
        posterSource={
          media.variants?.videoThumbnail
            ? { uri: media.variants.videoThumbnail }
            : undefined
        }
        posterStyle={styles.media}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  media: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
});

export default MediaRenderer;
