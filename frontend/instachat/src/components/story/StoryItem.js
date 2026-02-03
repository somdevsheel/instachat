import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AVATAR_SIZE = 64;
const IMAGE_SIZE = 58;
const PLACEHOLDER =
  'https://via.placeholder.com/100';

/**
 * StoryItem
 * - Instagram-style rings
 * - unseen → pink ring
 * - seen → grey ring
 * - your story → plus badge if empty
 */
const StoryItem = ({ item, onPress }) => {
  if (!item) return null;

  const {
    user = {},
    isMe = false,
    hasStory = false,
    stories = [],
  } = item;

  const avatarUri =
    user.profilePicture || PLACEHOLDER;

  /* =========================
     SEEN LOGIC (CRITICAL)
  ========================= */
  const isSeen = useMemo(() => {
    if (!hasStory || isMe) return false;
    return stories.every(
      story => story.isSeen === true
    );
  }, [hasStory, isMe, stories]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* AVATAR RING */}
      <View
        style={[
          styles.avatarWrapper,
          hasStory && !isSeen && styles.unseenRing,
          hasStory && isSeen && styles.seenRing,
        ]}
      >
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
        />

        {/* PLUS BADGE (Your story only) */}
        {isMe && !hasStory && (
          <View style={styles.plusBadge}>
            <Ionicons
              name="add"
              size={14}
              color="#fff"
            />
          </View>
        )}
      </View>

      {/* USERNAME */}
      <Text
        style={styles.name}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {isMe ? 'Your story' : user.username || ''}
      </Text>
    </TouchableOpacity>
  );
};

export default memo(StoryItem);

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
  },

  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },

  unseenRing: {
    borderWidth: 2,
    borderColor: '#d62976', // Instagram pink
  },

  seenRing: {
    borderWidth: 2,
    borderColor: '#555', // muted grey
  },

  avatar: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
  },

  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },

  name: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    maxWidth: 72,
    textAlign: 'center',
  },
});

