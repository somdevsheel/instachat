import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
  Text,
  StatusBar,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { markStoriesSeen } from '../../api/Story.api';

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

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  // ✅ Track viewed stories (ADDED)
  const viewedStoryIds = useRef(new Set());

  const currentStory = stories[currentIndex];
  const mediaUrl = currentStory?.media?.url;
  const mediaType = currentStory?.media?.type;

  // ✅ Collect viewed story IDs (ADDED)
  useEffect(() => {
    if (currentStory?._id) {
      viewedStoryIds.current.add(currentStory._id);
    }
  }, [currentStory]);

  // Create video player
  const player = useVideoPlayer(
    mediaType === 'video' ? mediaUrl : null,
    player => {
      if (mediaType === 'video') {
        player.loop = false;
        player.play();
      }
    }
  );

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
        if (finished && !paused) {
          goNext();
        }
      });
    },
    [progress, paused]
  );

  /* =========================
     STORY CHANGE EFFECT
  ========================= */
  useEffect(() => {
    if (!currentStory) return;
    setImageLoaded(false);
  }, [currentIndex, currentStory]);

  /* =========================
     VIDEO PLAYER LISTENER
  ========================= */
  useEffect(() => {
    if (!player || mediaType !== 'video') return;

    const subscription = player.addListener(
      'statusChange',
      (status, oldStatus, error) => {
        if (error) {
          Alert.alert(
            'Video Error',
            'Failed to play this video',
            [
              { text: 'Skip', onPress: () => goNext() },
              { text: 'Close', onPress: closeViewer },
            ]
          );
          return;
        }

        if (status === 'readyToPlay') {
          const duration = player.duration * 1000;
          if (duration > 0) {
            startProgress(duration);
          }
        }

        if (status === 'idle' && player.currentTime > 0) {
          goNext();
        }
      }
    );

    return () => subscription.remove();
  }, [player, mediaType, startProgress]);

  /* =========================
     IMAGE LOADED
  ========================= */
  useEffect(() => {
    if (imageLoaded && mediaType === 'image') {
      startProgress(IMAGE_DURATION);
    }
  }, [imageLoaded, mediaType, startProgress]);

  /* =========================
     MARK STORIES SEEN + CLOSE
  ========================= */
  const closeViewer = useCallback(async () => {
    try {
      const ids = Array.from(viewedStoryIds.current);
      if (ids.length > 0) {
        await markStoriesSeen(ids);
      }
    } catch (err) {
      console.warn('❌ Failed to mark stories seen');
    } finally {
      navigation.goBack();
    }
  }, [navigation]);

  /* =========================
     NAVIGATION
  ========================= */
  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      closeViewer(); // ✅ important
    }
  }, [currentIndex, stories.length, closeViewer]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  /* =========================
     PAUSE / RESUME
  ========================= */
  const handleLongPress = () => {
    setPaused(true);
    progress.stopAnimation();
    if (player && mediaType === 'video') {
      player.pause();
    }
  };

  const handlePressOut = () => {
    setPaused(false);
    if (player && mediaType === 'video') {
      player.play();
    }
  };

  /* =========================
     LOADING STATES
  ========================= */
  if (!currentStory) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!mediaUrl) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Story media not found</Text>
        <TouchableOpacity onPress={closeViewer}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* PROGRESS BAR */}
      <View style={styles.progressRow}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressTrack}>
            {index < currentIndex && <View style={styles.progressFill} />}
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
      {mediaType === 'image' ? (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          resizeMode="contain"
          onLoad={() => setImageLoaded(true)}
        />
      ) : (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="contain"
          nativeControls={false}
        />
      )}

      {/* TAP AREAS */}
      <View style={styles.touchLayer}>
        <TouchableWithoutFeedback
          onPress={goPrev}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
        >
          <View style={styles.leftZone} />
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback
          onPress={goNext}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
        >
          <View style={styles.rightZone} />
        </TouchableWithoutFeedback>
      </View>

      {/* CLOSE */}
      <TouchableOpacity
        style={styles.closeIcon}
        onPress={closeViewer}
      >
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default StoryViewer;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  media: { width, height },
  progressRow: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
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
  leftZone: { width: width / 2, height },
  rightZone: { width: width / 2, height },
  closeIcon: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
  },
  loader: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: 'white' },
  closeButtonText: { color: 'white' },
});
