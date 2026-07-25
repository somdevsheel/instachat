import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';

import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchReels,
  toggleReelLike,
  trackReelView,
  setCurrentIndex,
  deleteReel,
} from '../../redux/slices/reelSlice';

import { toggleFollow } from '../../redux/slices/followSlice';

import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';
import ReelOptionsSheet from './ReelOptionsSheet';
import { submitReport } from '../../api/report.api';
import ShareSheet from '../../components/organisms/ShareSheet';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
  Dimensions.get('window');

/* ======================================================
   FORMAT COUNTS
====================================================== */
const formatCount = (count = 0) => {
  if (count < 1000) return String(count);

  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }

  return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
};

/* ======================================================
   HEADER COMPONENT
====================================================== */
const ReelsHeader = memo(() => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleCreateReel = () => {
    navigation.navigate(ROUTES.UPLOAD_REEL);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Reels</Text>

        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCreateReel}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ======================================================
   SINGLE REEL
====================================================== */
const ReelItem = memo((props) => {
  const {
    item,
    isActive,
    isScreenFocused,
    currentUserId,
    bottomInset,
    onLike,
    onUserPress,
    onCommentPress,
    onSharePress,
    onOptionsPress,
    onFollowPress,
  } = props;

  const videoRef = useRef(null);
  const lastTap = useRef(0);
  const timeoutRef = useRef(null);

  const heartScale = useRef(new Animated.Value(0)).current;

  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const isOwnReel =
    currentUserId && item?.user?._id === currentUserId;

  const shouldPlay =
    isActive && isScreenFocused && !paused && loaded;

  /* =========================
     PLAY CONTROL
  ========================= */
  useEffect(() => {
    const control = async () => {
      try {
        if (!videoRef.current) return;

        if (shouldPlay) {
          await videoRef.current.playAsync();
        } else {
          await videoRef.current.pauseAsync();
        }
      } catch {}
    };

    control();
  }, [shouldPlay]);

  /* =========================
     CLEANUP
  ========================= */
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);

      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  /* =========================
     RESET ON ITEM CHANGE
  ========================= */
  useEffect(() => {
    setPaused(false);
    setLoaded(false);
    setBuffering(true);
    setFailed(false);
  }, [item?._id]);

  /* =========================
     TAP HANDLER
  ========================= */
  const handleTap = useCallback(() => {
    const now = Date.now();
    const delay = 300;

    if (now - lastTap.current < delay) {
      handleDoubleTap();
      lastTap.current = 0;
    } else {
      lastTap.current = now;

      timeoutRef.current = setTimeout(() => {
        if (lastTap.current !== 0) {
          setPaused((p) => !p);
        }
      }, delay);
    }
  }, []);

  /* =========================
     DOUBLE TAP
  ========================= */
  const handleDoubleTap = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (!item?.isLiked) {
      onLike(item._id);
    }
  };

  /* =========================
     PLAYBACK STATUS
  ========================= */
  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) {
      setBuffering(status.isBuffering);
    }

    if (status.error) {
      console.error('Video error:', status.error);
    }
  }, []);

  return (
    <View style={styles.reelContainer}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              console.log(e);
              setFailed(true);
              setBuffering(false);
            }}
          />

          {failed && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="rgba(255,255,255,0.6)" />
              <Text style={styles.errorText}>Couldn't load this video</Text>
            </View>
          )}

          {buffering && isActive && !failed && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {paused && !failed && (
            <View style={styles.pausedContainer}>
              <Ionicons
                name="play"
                size={60}
                color="rgba(255,255,255,0.8)"
              />
            </View>
          )}

          <Animated.View
            style={[
              styles.doubleTapHeart,
              {
                transform: [{ scale: heartScale }],
                opacity: heartScale,
              },
            ]}
          >
            <Ionicons name="heart" size={100} color={colors.accentPink} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* ACTIONS - Right Side */}
      <View
        style={[
          styles.actionsContainer,
          { bottom: 80 + bottomInset },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(item._id)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={item.isLiked ? colors.accentPink : '#fff'}
          />
          <Text style={styles.actionText}>
            {formatCount(item.likesCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onCommentPress(item._id)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={30}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {formatCount(item.commentsCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSharePress(item)}
        >
          <Ionicons
            name="paper-plane-outline"
            size={30}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {formatCount(item.shareCount || 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onOptionsPress(item)}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* BOTTOM INFO */}
      <View
        style={[
          styles.bottomOverlay,
          { bottom: 60 + bottomInset },
        ]}
      >
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => onUserPress(item.user)}
        >
          <Image
            source={{
              uri:
                item.user?.profilePicture ||
                'https://via.placeholder.com/150',
            }}
            style={styles.avatar}
          />

          <Text style={styles.username}>
            {item.user?.username || 'user'}
          </Text>

          {!isOwnReel && !item.user?.isFollowing && (
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => onFollowPress(item.user)}
            >
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {!!item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}

        {/* Audio info - Instagram style */}
        {item.audioName && (
          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={14} color="#fff" />
            <Text style={styles.audioText} numberOfLines={1}>
              {item.audioName || 'Original audio'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

/* ======================================================
   MAIN SCREEN
====================================================== */
const ReelsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const isFocused = useIsFocused();

  const { reels, loading, refreshing, pagination } =
    useSelector((s) => s.reels);

  const userId = useSelector(
    (s) => s.auth.user?._id
  );

  const viewed = useRef(new Set());

  const [index, setIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [showShare, setShowShare] = useState(false);

  /* LOAD */
  useEffect(() => {
    if (reels.length === 0) {
      dispatch(fetchReels({ page: 1 }));
    }
  }, [dispatch, reels.length]);

  /* REFRESH ON FOCUS - to show newly uploaded reels */
  useEffect(() => {
    if (isFocused) {
      // Refresh reels list when screen comes into focus
      dispatch(fetchReels({ page: 1, refresh: true }));
    }
  }, [isFocused, dispatch]);

  /* SYNC */
  useEffect(() => {
    dispatch(setCurrentIndex(index));
  }, [index, dispatch]);

  /* VIEW TRACK */
  useEffect(() => {
    if (!isFocused) return;

    const reel = reels[index];

    if (reel && !viewed.current.has(reel._id)) {
      viewed.current.add(reel._id);
      dispatch(trackReelView(reel._id));
    }
  }, [index, reels, isFocused, dispatch]);

  /* PULL TO REFRESH */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchReels({ page: 1, refresh: true })).unwrap();
      // Clear viewed set to allow retracking views
      viewed.current.clear();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  /* FOLLOW USER */
  const handleFollowUser = useCallback(async (user) => {
    if (!user?._id) return;

    try {
      await dispatch(toggleFollow(user._id)).unwrap();
      // Success - no need to show alert, button will disappear
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to follow user. Please try again.');
    }
  }, [dispatch]);

  /* OPTIONS SHEET HANDLERS */
  const handleOptionsPress = useCallback((reel) => {
    setSelectedReel(reel);
    setShowOptionsSheet(true);
  }, []);

  const handleCloseOptions = useCallback(() => {
    setShowOptionsSheet(false);
    setTimeout(() => setSelectedReel(null), 300);
  }, []);

  const handleDeleteReel = useCallback(async () => {
    if (!selectedReel?._id) return;

    try {
      await dispatch(deleteReel(selectedReel._id)).unwrap();
      Alert.alert('Success', 'Reel deleted successfully');
      // Refresh the list
      await dispatch(fetchReels({ page: 1, refresh: true }));
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete reel. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleReportReel = useCallback(async (reason) => {
    if (!selectedReel?._id) return;

    try {
      await submitReport({
        targetType: 'reel',
        targetId: selectedReel._id,
        reason,
      });
      Alert.alert('Thank you', 'We\'ve received your report and will review it shortly.');
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Error', 'Failed to report reel. Please try again.');
    }
  }, [selectedReel]);

  const handleHideReel = useCallback(async () => {
    if (!selectedReel?._id) return;

    try {
      // Hide locally by refreshing the feed
      Alert.alert('Hidden', 'You won\'t see posts like this in your feed.');
      await dispatch(fetchReels({ page: 1, refresh: true }));
    } catch (error) {
      console.error('Hide error:', error);
      Alert.alert('Error', 'Failed to hide reel. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleUnfollowUser = useCallback(async () => {
    if (!selectedReel?.user?._id) return;

    try {
      await dispatch(toggleFollow(selectedReel.user._id)).unwrap();
      Alert.alert('Success', `You unfollowed @${selectedReel.user.username}`);
      // Refresh the list
      await dispatch(fetchReels({ page: 1, refresh: true }));
    } catch (error) {
      console.error('Unfollow error:', error);
      Alert.alert('Error', 'Failed to unfollow. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleCopyLink = useCallback(() => {
    if (!selectedReel?._id) return;

    // Copy link logic - you'll need to implement based on your app's URL scheme
    const link = `yourapp://reel/${selectedReel._id}`;
    // Clipboard.setString(link);
    Alert.alert('Link copied', 'Reel link copied to clipboard');
  }, [selectedReel]);

  const handleShareReel = useCallback(() => {
    if (!selectedReel) return;
    setShowShare(true);
  }, [selectedReel]);

  /* HANDLERS */
  const handleLike = useCallback(
    (id) => dispatch(toggleReelLike(id)),
    [dispatch]
  );

  const handleUser = useCallback(
    (u) =>
      u?._id &&
      navigation.navigate(ROUTES.USER_PROFILE, {
        userId: u._id,
      }),
    [navigation]
  );

  const handleComment = useCallback(
    (id) =>
      navigation.navigate(ROUTES.COMMENTS, {
        reelId: id,
        type: 'reel',
      }),
    [navigation]
  );

  const handleLoadMore = useCallback(() => {
    if (
      !refreshing &&
      pagination.page < pagination.totalPages
    ) {
      dispatch(
        fetchReels({ page: pagination.page + 1 })
      );
    }
  }, [dispatch, refreshing, pagination]);

  /* VIEWABILITY */
  const viewConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewable = useRef(({ viewableItems }) => {
    if (viewableItems[0]?.index != null) {
      setIndex(viewableItems[0].index);
    }
  }).current;

  /* RENDER */
  const renderItem = useCallback(
    ({ item, index: i }) => (
      <ReelItem
        item={item}
        isActive={i === index}
        isScreenFocused={isFocused}
        currentUserId={userId}
        bottomInset={insets.bottom}
        onLike={handleLike}
        onUserPress={handleUser}
        onCommentPress={handleComment}
        onSharePress={(reel) => {
          setSelectedReel(reel);
          setShowShare(true);
        }}
        onOptionsPress={handleOptionsPress}
        onFollowPress={handleFollowUser}
      />
    ),
    [
      index,
      isFocused,
      userId,
      insets.bottom,
      handleLike,
      handleUser,
      handleComment,
      handleOptionsPress,
      handleFollowUser,
    ]
  );

  if (loading && reels.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <ReelsHeader />

      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={(i) => i._id || Math.random()}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewConfig}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={
          Platform.OS === 'android'
        }
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        extraData={isFocused}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={['#fff']}
            progressBackgroundColor="rgba(0,0,0,0.5)"
            title="Pull to refresh"
            titleColor="#fff"
          />
        }
      />

      {/* Options Bottom Sheet */}
      <ReelOptionsSheet
        visible={showOptionsSheet}
        onClose={handleCloseOptions}
        isOwnReel={selectedReel?.user?._id === userId}
        username={selectedReel?.user?.username || 'user'}
        onDelete={handleDeleteReel}
        onReport={handleReportReel}
        onHide={handleHideReel}
        onUnfollow={handleUnfollowUser}
        onCopyLink={handleCopyLink}
        onShare={handleShareReel}
      />

      {/* SHARE SHEET */}
      <ShareSheet
        visible={showShare}
        onClose={() => setShowShare(false)}
        contentType="reel"
        contentId={selectedReel?._id}
        contentPreview={{
          image: selectedReel?.thumbnailUrl,
          caption: selectedReel?.caption,
        }}
      />
    </View>
  );
};

export default ReelsScreen;

/* ======================================================
   STYLES
====================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },

  /* HEADER */
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  cameraButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  /* REEL */
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.bg,
  },

  videoWrapper: {
    flex: 1,
  },

  video: {
    width: '100%',
    height: '100%',
  },

  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pausedContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
  },

  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },

  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
  },

  /* ACTIONS */
  actionsContainer: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 8,
  },

  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },

  actionText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  avatarButton: {
    marginTop: 8,
  },

  actionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },

  /* BOTTOM INFO */
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 80,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
    marginRight: 10,
  },

  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  followButton: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 8,
  },

  followText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  caption: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },

  audioText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
