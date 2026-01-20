import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const IMAGE_DURATION = 5000;

const StoryViewer = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    stories = [],
    userId,
    initialIndex = 0,
  } = route.params || {};

  const userStories = stories.filter(
    s => s?.user?._id === userId
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);

  const currentStory = userStories[currentIndex];

  /* =========================
     PROGRESS HANDLING
  ========================= */
  const startProgress = useCallback(
    duration => {
      progress.stopAnimation();
      progress.setValue(0);

      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          goNext();
        }
      });
    },
    [progress]
  );

  /* =========================
     STORY CHANGE EFFECT
  ========================= */
  useEffect(() => {
    if (!currentStory) return;

    if (currentStory.mediaType === 'image') {
      startProgress(IMAGE_DURATION);
    }
  }, [currentIndex, currentStory, startProgress]);

  /* =========================
     NAVIGATION
  ========================= */
  const goNext = useCallback(() => {
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      navigation.goBack();
    }
  }, [currentIndex, userStories.length, navigation]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  /* =========================
     VIDEO EVENTS
  ========================= */
  const handleVideoLoad = status => {
    if (!status?.durationMillis) return;
    startProgress(status.durationMillis);
  };

  if (!currentStory) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* PROGRESS BAR */}
      <View style={styles.progressRow}>
        {userStories.map((_, index) => (
          <View key={index} style={styles.progressTrack}>
            {index < currentIndex && (
              <View style={styles.progressFill} />
            )}

            {index === currentIndex && (
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* MEDIA */}
      {currentStory.mediaType === 'image' ? (
        <Image
          source={{ uri: currentStory.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : (
        <Video
          ref={videoRef}
          source={{ uri: currentStory.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
          shouldPlay
          isLooping={false}
          onLoad={handleVideoLoad}
          onPlaybackStatusUpdate={status => {
            if (status?.didJustFinish) {
              goNext();
            }
          }}
        />
      )}

      {/* TAP AREAS */}
      <View style={styles.touchLayer}>
        <TouchableWithoutFeedback onPress={goPrev}>
          <View style={styles.leftZone} />
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={goNext}>
          <View style={styles.rightZone} />
        </TouchableWithoutFeedback>
      </View>

      {/* CLOSE */}
      <Ionicons
        name="close"
        size={30}
        color="white"
        style={styles.close}
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

export default StoryViewer;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },

  media: {
    width,
    height,
  },

  progressRow: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 10,
  },

  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: 'white',
  },

  touchLayer: {
    position: 'absolute',
    width,
    height,
    flexDirection: 'row',
  },

  leftZone: {
    width: width / 2,
    height,
  },

  rightZone: {
    width: width / 2,
    height,
  },

  close: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
  },

  loader: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
