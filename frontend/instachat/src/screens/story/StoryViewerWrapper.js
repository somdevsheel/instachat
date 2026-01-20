import React from 'react';
import { View, StyleSheet } from 'react-native';
import StoryViewer from '../../components/story/StoryViewer';

const StoryViewerWrapper = ({ route, navigation }) => {
  const { stories, initialIndex = 0 } = route.params;

  return (
    <View style={styles.container}>
      <StoryViewer
        stories={stories}
        initialIndex={initialIndex}
        onClose={() => navigation.goBack()}
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
