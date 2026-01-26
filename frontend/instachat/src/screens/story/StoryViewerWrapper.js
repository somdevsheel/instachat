import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import StoryViewer from '../../components/story/StoryViewer';
import { markStoriesViewed } from '../../redux/slices/storySlice';

const StoryViewerWrapper = ({ route, navigation }) => {
  const dispatch = useDispatch();

  const { stories = [], initialIndex = 0 } = route.params;

  // ✅ MARK STORIES AS VIEWED ON CLOSE
  const handleClose = useCallback(() => {
    if (stories.length > 0) {
      const storyIds = stories.map(story => story._id);
      dispatch(markStoriesViewed(storyIds));
    }

    navigation.goBack();
  }, [dispatch, navigation, stories]);

  return (
    <View style={styles.container}>
      <StoryViewer
        stories={stories}
        initialIndex={initialIndex}
        onClose={handleClose} // ✅ IMPORTANT
      />
    </View>
  );
};

export default StoryViewerWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
