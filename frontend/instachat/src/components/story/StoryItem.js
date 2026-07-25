import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors, { gradients } from '../../theme/colors';

const RING_SIZE = 66;
const INNER_SIZE = 61;
const IMAGE_SIZE = 57;
const PLACEHOLDER =
  'https://via.placeholder.com/100';

const TRANSPARENT = ['transparent', 'transparent'];

/**
 * StoryItem
 * - unseen → gradient ring
 * - seen → muted ring
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

  const ringColors = hasStory && !isSeen ? gradients.storyRing : TRANSPARENT;
  const ringBg = !hasStory ? colors.surfaceRaised : isSeen ? colors.borderSoft : 'transparent';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* AVATAR RING */}
      <LinearGradient
        colors={ringColors}
        style={[styles.ringOuter, { backgroundColor: ringBg }]}
      >
        <View style={styles.ringInner}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
          />
        </View>

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
      </LinearGradient>

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

  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ringInner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },

  name: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 6,
    maxWidth: 72,
    textAlign: 'center',
  },
});
