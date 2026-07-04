import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';

/**
 * ======================================================
 * REEL THUMBNAIL
 * ======================================================
 * Generates a thumbnail from a video URL using expo-video-thumbnails.
 * Falls back to a placeholder if generation fails.
 *
 * Usage:
 *   <ReelThumbnail
 *     videoUrl="https://..."
 *     thumbnailUrl=""          // use if already available
 *     style={{ width: 120, height: 120 }}
 *   />
 */

// In-memory cache to avoid regenerating thumbnails
const thumbnailCache = {};

export default function ReelThumbnail({ videoUrl, thumbnailUrl, style }) {
  const [thumb, setThumb] = useState(thumbnailUrl || null);
  const [loading, setLoading] = useState(!thumbnailUrl);

  useEffect(() => {
    // If we already have a thumbnail URL, use it
    if (thumbnailUrl) {
      setThumb(thumbnailUrl);
      setLoading(false);
      return;
    }

    if (!videoUrl) {
      setLoading(false);
      return;
    }

    // Check cache first
    if (thumbnailCache[videoUrl]) {
      setThumb(thumbnailCache[videoUrl]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const generate = async () => {
      try {
        const result = await VideoThumbnails.getThumbnailAsync(videoUrl, {
          time: 1000, // 1 second into video
          quality: 0.5,
        });

        if (mounted && result?.uri) {
          thumbnailCache[videoUrl] = result.uri;
          setThumb(result.uri);
        }
      } catch (err) {
        // Silently fail — will show placeholder
        console.log('Thumbnail generation failed:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    generate();

    return () => {
      mounted = false;
    };
  }, [videoUrl, thumbnailUrl]);

  if (loading) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator size="small" color="#555" />
      </View>
    );
  }

  if (thumb) {
    return <Image source={{ uri: thumb }} style={[styles.image, style]} />;
  }

  // Fallback placeholder
  return (
    <View style={[styles.placeholder, style]}>
      <Ionicons name="film-outline" size={28} color="#555" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});