import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
  Pressable,
  PanResponder,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import {
  markStoriesSeen,
  deleteStory,
} from '../../api/Story.api';

import OwnStoryFooter from './OwnStoryFooter';
import OtherStoryFooter from './OtherStoryFooter';

const { width } = Dimensions.get('window');
const IMAGE_DURATION = 5000;
const SWIPE_CLOSE_DISTANCE = 120;

const StoryViewer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const currentUserId = useSelector(state => state.auth.user?._id);

  const { stories = [], initialIndex = 0 } = route.params || {};

  /* ================= STATE ================= */
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  // 🔒 SINGLE SOURCE OF TRUTH
  const [isHardPaused, setIsHardPaused] = useState(false);

  // Refs for keyboard listener to avoid recreating
  const emojiOpenRef = useRef(false);
  const menuVisibleRef = useRef(false);
  const isSendingRef = useRef(false);

  /* ================= LIFECYCLE GUARD ================= */
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync refs with state for keyboard listeners
  useEffect(() => {
    emojiOpenRef.current = emojiOpen;
  }, [emojiOpen]);

  useEffect(() => {
    menuVisibleRef.current = menuVisible;
  }, [menuVisible]);

  /* ================= PROGRESS ================= */
  const progress = useRef(new Animated.Value(0)).current;
  const storyStartTime = useRef(0);
  const elapsedTime = useRef(0);
  const totalDuration = useRef(0);
  const isPausedRef = useRef(false);

  const translateY = useRef(new Animated.Value(0)).current;
  const viewedStoryIds = useRef(new Set());

  const currentStory = stories[currentIndex];
  const mediaUrl = currentStory?.media?.url;
  const mediaType = currentStory?.media?.type;

  const isOwnStory =
    currentStory?.user?._id === currentUserId;

  /* ================= VIDEO ================= */
  const player = useVideoPlayer(
    mediaType === 'video' ? mediaUrl : null,
    p => {
      if (mediaType === 'video') {
        p.loop = false;
        p.play();
      }
    }
  );

  /* ================= SAFE VIDEO HELPERS ================= */
  const safePlay = () => {
    if (
      isMountedRef.current &&
      player &&
      mediaType === 'video'
    ) {
      try {
        player.play();
      } catch {}
    }
  };

  const safePause = () => {
    if (
      isMountedRef.current &&
      player &&
      mediaType === 'video'
    ) {
      try {
        player.pause();
      } catch {}
    }
  };

  /* ================= PROGRESS CONTROL ================= */
  const startProgress = duration => {
    totalDuration.current = duration;
    storyStartTime.current = Date.now();

    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isHardPaused) {
        goNext();
      }
    });
  };

  const pauseProgress = () => {
    if (isPausedRef.current) return; // Already paused, don't accumulate time again
    isPausedRef.current = true;
    progress.stopAnimation();
    elapsedTime.current += Date.now() - storyStartTime.current;
  };

  const resumeProgress = () => {
    if (!isPausedRef.current) return; // Not paused, nothing to resume
    isPausedRef.current = false;

    const remaining =
      totalDuration.current - elapsedTime.current;

    if (remaining <= 0) return goNext();

    storyStartTime.current = Date.now();
    Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isHardPaused) {
        goNext();
      }
    });
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    progress.setValue(0);
    elapsedTime.current = 0;
    isPausedRef.current = false;
    setImageLoaded(false);

    if (currentStory?._id) {
      viewedStoryIds.current.add(currentStory._id);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (mediaType === 'image' && imageLoaded) {
      startProgress(IMAGE_DURATION);
    }
  }, [imageLoaded]);

  useEffect(() => {
    if (!player || mediaType !== 'video') return;

    const sub = player.addListener('statusChange', status => {
      if (status === 'readyToPlay') {
        startProgress(player.duration * 1000);
      }
      if (status === 'idle' && !isHardPaused) {
        goNext();
      }
    });

    return () => sub.remove();
  }, [player, mediaType, isHardPaused]);

  /* ================= KEYBOARD ================= */
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setIsTyping(true);
      setIsHardPaused(true);
      pauseProgress();
      safePause();
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setIsTyping(false);
      // Use refs to check current values without recreating listeners
      // Don't resume if emoji picker is open, menu is open, or currently sending a message
      if (!emojiOpenRef.current && !menuVisibleRef.current && !isSendingRef.current) {
        setIsHardPaused(false);
        safePlay();
        resumeProgress();
      }
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []); // No dependencies - refs always have current values

  /* ================= NAVIGATION ================= */
  const closeViewer = async () => {
    try {
      await markStoriesSeen(
        Array.from(viewedStoryIds.current)
      );
    } catch {}
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      closeViewer();
    }
  };

  /* ================= SWIPE DOWN ================= */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) =>
        g.dy > 0 && translateY.setValue(g.dy),
      onPanResponderRelease: (_, g) =>
        g.dy > SWIPE_CLOSE_DISTANCE
          ? closeViewer()
          : Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start(),
    })
  ).current;

  /* ================= DELETE ================= */
  const handleDelete = () => {
    setMenuVisible(false);
    setIsHardPaused(true);
    pauseProgress();
    safePause();

    Alert.alert(
      'Delete story?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteStory(currentStory._id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!currentStory || !mediaUrl) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* PROGRESS */}
      <View style={[styles.progressRow, { top: insets.top + 4 }]}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            {i < currentIndex && <View style={styles.progressFill} />}
            {i === currentIndex && (
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

      {/* HEADER */}
      <View style={[styles.topHeader, { top: insets.top + 16 }]}>
        <View style={styles.userRow}>
          <Image
            source={{
              uri:
                currentStory.user?.profilePicture ||
                'https://via.placeholder.com/40',
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>
            {currentStory.user?.username}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setMenuVisible(true);
            setIsHardPaused(true);
            pauseProgress();
            safePause();
          }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MEDIA */}
      <Animated.View
        style={{ flex: 1, transform: [{ translateY }] }}
        {...panResponder.panHandlers}
      >
        <TouchableWithoutFeedback
          onPress={goNext}
          onLongPress={() => {
            setIsHardPaused(true);
            pauseProgress();
            safePause();
          }}
          onPressOut={() => {
            if (menuVisible || isTyping || emojiOpen) return;
            setIsHardPaused(false);
            safePlay();
            resumeProgress();
          }}
        >
          <View style={styles.mediaWrapper}>
            {mediaType === 'image' ? (
              <Image
                source={{ uri: mediaUrl }}
                style={styles.media}
                resizeMode="cover"
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <VideoView
                player={player}
                style={styles.media}
                contentFit="cover"
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* FOOTER */}
      <View style={styles.footerWrapper}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isOwnStory ? (
            <OwnStoryFooter
              storyId={currentStory._id}
              viewerCount={currentStory.seenBy?.length || 0}
              onOpen={() => {
                setIsHardPaused(true);
                pauseProgress();
                safePause();
              }}
              onClose={() => {
                setIsHardPaused(false);
                safePlay();
                resumeProgress();
              }}
            />
          ) : (
            <OtherStoryFooter
              storyId={currentStory._id}
              receiverId={currentStory.user._id}
              onPause={() => {
                setIsHardPaused(true);
                pauseProgress();
                safePause();
              }}
              onResume={() => {
                setIsHardPaused(false);
                safePlay();
                resumeProgress();
              }}
              onSendStart={() => {
                isSendingRef.current = true;
              }}
              onSendEnd={() => {
                isSendingRef.current = false;
              }}
            />
          )}
        </KeyboardAvoidingView>
      </View>

      {/* MENU */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setMenuVisible(false);
            if (!isTyping && !emojiOpen) {
              setIsHardPaused(false);
              safePlay();
              resumeProgress();
            }
          }}
        >
          <View style={styles.sheet}>
            {isOwnStory ? (
              <TouchableOpacity onPress={handleDelete}>
                <Text style={[styles.sheetText, { color: 'red' }]}>
                  Delete story
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.sheetText}>Mute / Report</Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default StoryViewer;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },

  progressRow: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
  },
  progressFill: { height: '100%', backgroundColor: '#fff' },

  topHeader: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { color: '#fff', fontWeight: '600' },

  mediaWrapper: { flex: 1 },
  media: { width, aspectRatio: 9 / 16 },

  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: { backgroundColor: '#111', padding: 20 },
  sheetText: { color: '#fff', fontSize: 16, textAlign: 'center' },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});