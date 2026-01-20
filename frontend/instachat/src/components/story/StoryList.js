import React, { useEffect, useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { fetchStories } from '../../redux/slices/storySlice';
import StoryItem from './StoryItem';

/**
 * StoryList
 * - fetches stories
 * - groups by user
 * - ensures "Your story" is always first
 */
const StoryList = ({ navigation }) => {
  const dispatch = useDispatch();

  const { list = [], loading } = useSelector(
    state => state.stories
  );
  const { user } = useSelector(state => state.auth);

  /* =========================
     FETCH STORIES
  ========================= */
  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  /* =========================
     NORMALIZE DATA
  ========================= */
  const data = useMemo(() => {
    if (!user?._id || !Array.isArray(list)) {
      return [];
    }

    const groupedByUser = new Map();

    for (const story of list) {
      if (!story?.user?._id) continue;

      const userId = story.user._id;

      if (!groupedByUser.has(userId)) {
        groupedByUser.set(userId, {
          user: story.user,
          stories: [],
        });
      }

      groupedByUser
        .get(userId)
        .stories.push(story);
    }

    const groups = Array.from(
      groupedByUser.values()
    );

    const myGroup = groups.find(
      g => g.user._id === user._id
    );

    const otherGroups = groups.filter(
      g => g.user._id !== user._id
    );

    return [
      {
        isMe: true,
        hasStory: Boolean(myGroup),
        stories: myGroup?.stories || [],
        user,
      },
      ...otherGroups.map(group => ({
        isMe: false,
        hasStory: true,
        stories: group.stories,
        user: group.user,
      })),
    ];
  }, [list, user]);

  /* =========================
     HANDLER
  ========================= */
  const handlePress = useCallback(
    item => {
      if (item.isMe && !item.hasStory) {
        navigation.navigate('CREATE_STORY');
        return;
      }

      if (item.hasStory && item.stories.length > 0) {
        navigation.navigate('STORY_VIEWER', {
          stories: item.stories,
          initialIndex: 0,
          userId: item.user._id,
        });
      }
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
          ? `me-${item.user?._id || 'self'}`
          : `story-${item.user._id}`
      }
      renderItem={({ item }) => (
        <StoryItem
          item={item}
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
