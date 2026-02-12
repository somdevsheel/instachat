import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import StoryViewer from '../../components/story/StoryViewer';
import { markStoriesViewed } from '../../redux/slices/storySlice';

const StoryViewerWrapper = ({ route, navigation }) => {
  const dispatch = useDispatch();

  const { stories = [], initialIndex = 0 } = route.params || {};

  const handleClose = useCallback(
    (viewedIds = []) => {
      if (viewedIds.length > 0) {
        dispatch(markStoriesViewed(viewedIds));
      }
      navigation.goBack();
    },
    [dispatch, navigation]
  );

  return (
    <View style={styles.container}>
      <StoryViewer
        stories={stories}
        initialIndex={initialIndex}
        onClose={handleClose} // ✅ NOW USED
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
