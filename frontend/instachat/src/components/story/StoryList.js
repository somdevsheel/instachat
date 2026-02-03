import React, { useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import StoryItem from './StoryItem';

/**
 * StoryList
 * - Instagram-style story list
 * - Your story (+) opens Create Story
 * - Story tap opens Story Viewer
 */
const StoryList = ({ navigation }) => {
  const { list = [], loading } = useSelector(
    state => state.stories
  );
  const { user } = useSelector(state => state.auth);

  /* =========================
     NORMALIZE DATA
  ========================= */
  const data = useMemo(() => {
    if (!user?._id || !Array.isArray(list)) return [];

    const safeGroups = list.filter(
      g => g?.user?._id && Array.isArray(g.stories)
    );

    const myGroup = safeGroups.find(
      g => g.user._id === user._id
    );

    const otherGroups = safeGroups.filter(
      g => g.user._id !== user._id
    );

    return [
      {
        isMe: true,
        user,
        stories: myGroup?.stories || [],
      },
      ...otherGroups.map(group => ({
        isMe: false,
        user: group.user,
        stories: group.stories,
      })),
    ];
  }, [list, user]);

  /* =========================
     PRESS HANDLER (FIXED)
  ========================= */
  const handlePress = useCallback(
    item => {
      // ✅ YOUR STORY + NO STORIES → CREATE STORY
      if (item.isMe && item.stories.length === 0) {
        navigation.navigate('CREATE_STORY');
        return;
      }

      // ❌ SAFETY: no stories at all
      if (!item.stories.length) return;

      // ✅ FLATTEN STORIES (PRESERVE _id)
      const flattenedStories = item.stories.map(story => ({
        _id: story._id,
        media: story.media,
        seenBy: story.seenBy || [],
        isSeen: story.isSeen,
        createdAt: story.createdAt,
        user: item.user,
      }));

      navigation.navigate('STORY_VIEWER', {
        stories: flattenedStories,
        initialIndex: 0,
      });
    },
    [navigation]
  );

  if (loading || !user) return null;

  return (
    <FlatList
      horizontal
      data={data}
      showsHorizontalScrollIndicator={false}
      keyExtractor={item =>
        item.isMe
          ? `me-${item.user._id}`
          : `story-${item.user._id}`
      }
      renderItem={({ item }) => (
        <StoryItem
          item={{
            ...item,
            hasStory: item.stories.length > 0,
          }}
          onPress={() => handlePress(item)}
        />
      )}
      contentContainerStyle={{
        paddingHorizontal: 10,
      }}
    />
  );
};

export default StoryList;
