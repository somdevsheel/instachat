import React, { useEffect, useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStories } from '../../redux/slices/storySlice';
import StoryItem from './StoryItem';

/**
 * StoryList
 * - fetches stories
 * - groups by user
 * - "Your story" always first
 * - Instagram-style ring logic
 */
const StoryList = ({ navigation }) => {
  const dispatch = useDispatch();

  const { list = [], loading } = useSelector(state => state.stories);
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

    console.log('📊 Story list:', list);

    const myStoryGroup = list.find(
      group => group.user._id === user._id
    );

    const otherGroups = list.filter(
      group => group.user._id !== user._id
    );

    // 🔑 Only for OTHER users
    const hasUnseenStories = stories =>
      stories.some(story => story.isSeen === false);

    return [
      {
        isMe: true,
        // ✅ YOUR STORY → ring always shown if exists
        hasStory: Boolean(myStoryGroup?.stories?.length),
        stories: myStoryGroup?.stories || [],
        user,
      },
      ...otherGroups.map(group => ({
        isMe: false,
        // ✅ OTHER USERS → ring only if unseen
        hasStory:
          group.stories.length > 0 &&
          hasUnseenStories(group.stories),
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
      console.log('👆 Story pressed:', item);

      if (item.isMe && item.stories.length === 0) {
        navigation.navigate('CREATE_STORY');
        return;
      }

      if (item.stories.length > 0) {
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
