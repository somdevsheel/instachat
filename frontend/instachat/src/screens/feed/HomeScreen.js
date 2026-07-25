import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchFeed } from '../../redux/slices/feedSlice';
import {
  fetchStories,
  setViewedStories,
} from '../../redux/slices/storySlice';
import { fetchReels } from '../../redux/slices/reelSlice';
import { setUnreadCount } from '../../redux/slices/notificationSlice';
import { getUnreadCount } from '../../api/Notification.api';
import FeedPost from '../../components/organisms/FeedPost';
import StoryList from '../../components/story/StoryList';
import FeedTabs from '../../components/molecules/FeedTabs';
import ReelThumbnail from '../../components/molecules/ReelThumbnail';
import AddContentSheet from '../../components/bottomsheet/AddContentSheet';
import { ROUTES } from '../../navigation/routes.constants';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import feedEvents from '../../utils/feedEvents';
import colors, { gradients } from '../../theme/colors';

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
};

const VIEWABILITY_THRESHOLD = 70;
const HEADER_HEIGHT = 50;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { posts = [], loading } = useSelector(state => state.feed);
  const currentUserId = useSelector(state => state.auth.user?._id);
  const unreadCount = useSelector(
    state => state.notifications.unreadCount
  );
  const reels = useSelector(state => state.reels.reels);

  const [showMenu, setShowMenu] = useState(false);
  const [visiblePostId, setVisiblePostId] = useState(null);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [deletedPostIds, setDeletedPostIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('for_you');

  /* ======================
     RESTORE VIEWED STORIES
  ====================== */
  useEffect(() => {
    const restoreViewedStories = async () => {
      const stored = await AsyncStorage.getItem(
        '@instachat_viewed_stories'
      );
      if (stored) {
        dispatch(setViewedStories(JSON.parse(stored)));
      }
    };

    restoreViewedStories();
  }, [dispatch]);

  /* ======================
     FETCH UNREAD COUNT
  ====================== */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      dispatch(setUnreadCount(res.data.count));
    } catch (err) {
      console.error('Unread count error:', err);
    }
  }, [dispatch]);

  /* ======================
     INITIAL LOAD (FOCUS SAFE)
  ====================== */
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFeed(activeFilter));
      dispatch(fetchStories());
      if (reels.length === 0) dispatch(fetchReels({ page: 1 }));
      fetchUnreadCount();
    }, [dispatch, fetchUnreadCount, reels.length, activeFilter])
  );

  /* ======================
     UNREAD COUNT POLLING
  ====================== */
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /* ======================
     REFRESH AFTER UPLOAD
  ====================== */
  useEffect(() => {
    const refresh = () => dispatch(fetchFeed());
    feedEvents.on('refreshFeed', refresh);
    return () => feedEvents.off('refreshFeed', refresh);
  }, [dispatch]);

  /* ======================
     UPLOAD PREVIEWS
  ====================== */
  useEffect(() => {
    const onUploadUpdate = queue => {
      const previews = queue.map(item => ({
        _id: item.id,
        isUploading: true,
        uploadProgress: item.progress || 0,
        caption: item.caption,
        media: {
          type: item.file.type.startsWith('video')
            ? 'video'
            : 'image',
          variants: { original: item.file.uri },
        },
        user: { username: 'You', profilePicture: null },
      }));

      setUploadPreviews(previews);
    };

    feedEvents.on('uploadUpdate', onUploadUpdate);
    return () => feedEvents.off('uploadUpdate', onUploadUpdate);
  }, []);

  /* ======================
     PULL TO REFRESH
  ====================== */
  const handleRefresh = useCallback(() => {
    dispatch(fetchFeed(activeFilter));
    dispatch(fetchStories());
    fetchUnreadCount();
  }, [dispatch, fetchUnreadCount, activeFilter]);

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);

  /* ======================
     HANDLE POST DELETION
  ====================== */
  const handlePostDeleted = useCallback((postId) => {
    console.log('Post deleted:', postId);
    // Add to deleted set for immediate UI update
    setDeletedPostIds(prev => new Set([...prev, postId]));
    
    // Optionally refresh feed after a short delay
    setTimeout(() => {
      dispatch(fetchFeed());
    }, 500);
  }, [dispatch]);

  /* ======================
     NORMALIZE POSTS
  ====================== */
  const normalizedPosts = useMemo(() => {
    if (!currentUserId) return posts;

    return posts
      .filter(post => !deletedPostIds.has(post._id)) // Filter out deleted posts
      .map(post => ({
        ...post,
        isLiked:
          Array.isArray(post.likes) &&
          post.likes.includes(currentUserId),
      }));
  }, [posts, currentUserId, deletedPostIds]);

  const mergedPosts = useMemo(
    () => [...uploadPreviews, ...normalizedPosts],
    [uploadPreviews, normalizedPosts]
  );

  /* ======================
     VIEWABILITY
  ====================== */
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: VIEWABILITY_THRESHOLD,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (first?.item?._id) {
      setVisiblePostId(first.item._id);
    }
  }).current;

  /* ======================
     NAVIGATION
  ====================== */
  const openMenu = () => setShowMenu(true);
  const closeMenu = () => setShowMenu(false);

  const goToCreatePost = () => {
    closeMenu();
    navigation.navigate(ROUTES.CREATE_POST);
  };

  const goToCreateReel = () => {
    closeMenu();
    navigation.navigate(ROUTES.UPLOAD_REEL);
  };

  const goToCreateStory = () => {
    closeMenu();
    navigation.navigate(ROUTES.CREATE_STORY);
  };

  const goToNotifications = () => {
    navigation.getParent().navigate(ROUTES.NOTIFICATIONS);
  };

  const goToManageCloseFriends = () => {
    navigation.navigate(ROUTES.MANAGE_CLOSE_FRIENDS);
  };

  /* ======================
     RENDERERS
  ====================== */
  const renderPost = ({ item }) => (
    <FeedPost
      post={item}
      isVisible={item._id === visiblePostId}
      onPostDeleted={handlePostDeleted}
    />
  );

  const goToReels = () => {
    navigation.getParent().navigate(ROUTES.REELS);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.storyContainer}>
        <StoryList navigation={navigation} />
      </View>

      <FeedTabs
        activeFilter={activeFilter}
        onChange={setActiveFilter}
        onManagePress={goToManageCloseFriends}
      />

      {reels.length > 0 && (
        <View style={styles.reelsSection}>
          <View style={styles.reelsHeader}>
            <Text style={styles.reelsTitle}>Reels</Text>
            <TouchableOpacity onPress={goToReels}>
              <Text style={styles.reelsViewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={reels.slice(0, 8)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.reelsStrip}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.reelThumbWrap} onPress={goToReels}>
                <ReelThumbnail
                  videoUrl={item.videoUrl}
                  thumbnailUrl={item.thumbnailUrl}
                  style={styles.reelThumb}
                />
                <View style={styles.reelPlayBadge}>
                  <Ionicons name="play" size={10} color="#fff" />
                </View>
                <View style={styles.reelCount}>
                  <Ionicons name="play" size={10} color="#fff" />
                  <Text style={styles.reelCountText}>
                    {formatCount(item.viewsCount)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="image-outline" size={64} color={colors.textFaint} />
      <Text style={styles.emptyText}>No posts yet</Text>
      <Text style={styles.emptySubText}>
        Follow users or create your first post
      </Text>
    </View>
  );

  const showLoader = loading && mergedPosts.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <View style={styles.brand}>
          <LinearGradient colors={gradients.brand} style={styles.logoMark}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.logo}>Nebula</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
            <Ionicons name="add-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, styles.notificationIcon]}
            onPress={goToNotifications}
          >
            <Ionicons name="heart-outline" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showLoader ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={mergedPosts}
          keyExtractor={item => item._id}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={2}
          windowSize={3}
          contentContainerStyle={{ paddingBottom: 0 }}
        />
      )}

      <AddContentSheet
        visible={showMenu}
        onClose={closeMenu}
        onPost={goToCreatePost}
        onReel={goToCreateReel}
        onStory={goToCreateStory}
      />
    </SafeAreaView>
  );
};

export default React.memo(HomeScreen);

/* ======================
   STYLES
====================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accentPink,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  storyContainer: { marginVertical: 10 },
  reelsSection: { marginBottom: 10 },
  reelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  reelsTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  reelsViewAll: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  reelsStrip: {
    paddingHorizontal: 14,
    gap: 10,
  },
  reelThumbWrap: {
    width: 110,
    height: 138,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  reelThumb: {
    width: '100%',
    height: '100%',
  },
  reelPlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reelCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#888',
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
});