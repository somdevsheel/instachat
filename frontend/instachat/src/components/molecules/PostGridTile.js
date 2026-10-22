import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

/**
 * One square in a profile's post grid. Handles every post shape:
 * - normal image / video post
 * - repost (shows the ORIGINAL's image, with a repost badge)
 * - repost whose original is hidden from the viewer (lock tile)
 * - text-only post (shows the text)
 */
const tileImage = (item) => {
  const original = item.repostOf;
  if (original) {
    return item.repostOfModel === 'Reel'
      ? original.thumbnailUrl || null
      : original.media?.variants?.thumbnail || original.media?.variants?.original || null;
  }
  return item.media?.variants?.thumbnail || item.media?.variants?.original || null;
};

const isVideo = (item) =>
  item.repostOf
    ? item.repostOfModel === 'Reel' || item.repostOf.media?.type === 'video'
    : item.media?.type === 'video';

const PostGridTile = ({ item, style, onPress }) => {
  const uri = tileImage(item);
  const text = item.repostOf ? item.repostOf.caption : item.caption;

  return (
    <TouchableOpacity style={style} activeOpacity={0.9} onPress={onPress}>
      {item.repostUnavailable ? (
        <View style={styles.placeholder}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.textFaint} />
        </View>
      ) : uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.text} numberOfLines={4}>
            {text || ''}
          </Text>
        </View>
      )}

      <View style={styles.badges}>
        {!!item.repostOf && (
          <View style={styles.badge}>
            <Ionicons name="repeat" size={14} color="#fff" />
          </View>
        )}
        {isVideo(item) && (
          <View style={styles.badge}>
            <Ionicons name="play" size={14} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default PostGridTile;

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: colors.surfaceRaised,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  badges: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 3,
  },
});
