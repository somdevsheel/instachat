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
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { fetchFeed } from '../../redux/slices/feedSlice';
import { fetchStories } from '../../redux/slices/storySlice';
import FeedPost from '../../components/organisms/FeedPost';
import StoryList from '../../components/story/StoryList';
import AddContentSheet from '../../components/bottomsheet/AddContentSheet';
import { ROUTES } from '../../navigation/routes.constants';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import feedEvents from '../../utils/feedEvents';

const VIEWABILITY_THRESHOLD = 70;
const HEADER_HEIGHT = 50;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets(); // ✅ IMPORTANT

  const { posts = [], loading } = useSelector(state => state.feed);
  const currentUserId = useSelector(state => state.auth.user?._id);

  const [showMenu, setShowMenu] = useState(false);
  const [visiblePostId, setVisiblePostId] = useState(null);
  const [uploadPreviews, setUploadPreviews] = useState([]);

  /* ======================
     INITIAL LOAD
  ====================== */
  useEffect(() => {
    dispatch(fetchFeed());
    dispatch(fetchStories());
  }, [dispatch]);

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
          variants: {
            original: item.file.uri,
          },
        },
        user: {
          username: 'You',
          profilePicture: null,
        },
      }));

      setUploadPreviews(previews);
    };

    feedEvents.on('uploadUpdate', onUploadUpdate);
    return () =>
      feedEvents.off('uploadUpdate', onUploadUpdate);
  }, []);

  /* ======================
     PULL TO REFRESH
  ====================== */
  const handleRefresh = useCallback(() => {
    dispatch(fetchFeed());
    dispatch(fetchStories());
  }, [dispatch]);

  const { refreshing, onRefresh } =
    usePullToRefresh(handleRefresh);

  /* ======================
     NORMALIZE POSTS
  ====================== */
  const normalizedPosts = useMemo(() => {
    if (!currentUserId) return posts;

    return posts.map(post => ({
      ...post,
      isLiked:
        Array.isArray(post.likes) &&
        post.likes.includes(currentUserId),
    }));
  }, [posts, currentUserId]);

  /* ======================
     MERGE UPLOADS + FEED
  ====================== */
  const mergedPosts = useMemo(
    () => [...uploadPreviews, ...normalizedPosts],
    [uploadPreviews, normalizedPosts]
  );

  /* ======================
     VIEWABILITY (VIDEO)
  ====================== */
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: VIEWABILITY_THRESHOLD,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }) => {
      const first = viewableItems?.[0];
      if (first?.item?._id) {
        setVisiblePostId(first.item._id);
      }
    }
  ).current;

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

  /* ======================
     RENDERERS
  ====================== */
  const renderPost = ({ item }) => (
    <FeedPost
      post={item}
      isVisible={item._id === visiblePostId}
    />
  );

  const renderHeader = () => (
    <View style={styles.storyContainer}>
      <StoryList navigation={navigation} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons
        name="image-outline"
        size={64}
        color="#666"
      />
      <Text style={styles.emptyText}>No posts yet</Text>
      <Text style={styles.emptySubText}>
        Follow users or create your first post
      </Text>
    </View>
  );

  const showLoader = loading && mergedPosts.length === 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingBottom: insets.bottom }, // ✅ KEY FIX
      ]}
      edges={['top', 'bottom']} // ✅ IMPORTANT
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu}>
          <Ionicons name="add-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.logo}>Instachat</Text>

        <TouchableOpacity>
          <Ionicons
            name="heart-outline"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* FEED */}
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
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20, // ✅ EXTRA SAFETY
          }}
        />
      )}

      {/* ADD CONTENT */}
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontStyle: 'italic',
  },

  storyContainer: {
    marginVertical: 10,
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
