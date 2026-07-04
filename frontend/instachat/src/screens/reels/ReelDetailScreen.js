import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const formatCount = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const ReelDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { reelId } = route.params;
  const currentUserId = useSelector((state) => state.auth.user?._id);
  const dispatch = useDispatch();

  const videoRef = useRef(null);
  const lastTap = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;

  const [reel, setReel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  /* =========================
     FETCH REEL
  ========================= */
  const fetchReel = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/reels/${reelId}`);

      if (res.data?.success && res.data?.data) {
        const reelData = res.data.data;
        setReel(reelData);
        setLiked(reelData.isLiked || false);
        setLikesCount(reelData.likesCount || 0);
      } else {
        setError('Reel not found');
      }
    } catch (err) {
      console.error('Error fetching reel:', err);
      setError('Failed to load reel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReel();
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
      }
    };
  }, [reelId]);

  /* =========================
     LIKE
  ========================= */
  const handleLike = async () => {
    if (!reel?._id) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      await api.put(`/reels/${reel._id}/like`);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
    }
  };

  /* =========================
     TAP HANDLERS
  ========================= */
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap — like
      if (!liked) handleLike();
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
      ]).start();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current !== 0) {
          setPaused((p) => !p);
          lastTap.current = 0;
        }
      }, 300);
    }
  }, [liked]);

  /* =========================
     PLAY/PAUSE
  ========================= */
  useEffect(() => {
    if (!videoRef.current || !reel) return;
    if (paused) {
      videoRef.current.pauseAsync().catch(() => {});
    } else {
      videoRef.current.playAsync().catch(() => {});
    }
  }, [paused, reel]);

  /* =========================
     NAVIGATE TO PROFILE
  ========================= */
  const openProfile = () => {
    if (reel?.user?._id) {
      navigation.navigate(ROUTES.USER_PROFILE, {
        userId: reel.user._id,
      });
    }
  };

  /* =========================
     LOADING / ERROR
  ========================= */
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reel</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !reel) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reel</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#666" />
          <Text style={styles.errorText}>{error || 'Reel not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReel}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* BACK BUTTON (overlay) */}
      <View style={[styles.backButton, { top: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backTouchable}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.backTitle}>Reel</Text>
      </View>

      {/* VIDEO */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: reel.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={!paused}
          />

          {paused && (
            <View style={styles.pausedOverlay}>
              <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
            </View>
          )}

          {/* Double-tap heart */}
          <Animated.View
            style={[
              styles.doubleTapHeart,
              {
                transform: [{ scale: heartScale }],
                opacity: heartScale,
              },
            ]}
          >
            <Ionicons name="heart" size={100} color="#FF3B30" />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* RIGHT SIDE ACTIONS */}
      <View style={[styles.actionsContainer, { bottom: 100 + insets.bottom }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={30}
            color={liked ? '#FF3B30' : '#fff'}
          />
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate(ROUTES.COMMENTS, { postId: reel._id })
          }
        >
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionText}>
            {formatCount(reel.commentsCount)}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons name="eye-outline" size={28} color="#fff" />
          <Text style={styles.actionText}>
            {formatCount(reel.viewsCount)}
          </Text>
        </View>
      </View>

      {/* BOTTOM INFO */}
      <View style={[styles.bottomOverlay, { bottom: 30 + insets.bottom }]}>
        <TouchableOpacity style={styles.userRow} onPress={openProfile}>
          <Image
            source={{
              uri: reel.user?.profilePicture || 'https://via.placeholder.com/150',
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{reel.user?.username || 'user'}</Text>
        </TouchableOpacity>

        {!!reel.caption && (
          <Text style={styles.caption} numberOfLines={3}>
            {reel.caption}
          </Text>
        )}
      </View>
    </View>
  );
};

export default ReelDetailScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0095F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backTouchable: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doubleTapHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_HEIGHT * 0.4,
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 12,
    right: 80,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  username: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});