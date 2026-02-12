import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import FeedPost from '../../components/organisms/FeedPost';
import { getPostById } from '../../api/Posts.api';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import { ROUTES } from '../../navigation/routes.constants';

const HEADER_HEIGHT = 50;

const PostDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { postId } = route.params;
  const currentUserId = useSelector(state => state.auth.user?._id);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =========================
     FETCH POST
  ========================= */
  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPostById(postId);
      
      if (res.success && res.data) {
        // Normalize post with isLiked
        const normalizedPost = {
          ...res.data,
          isLiked: Array.isArray(res.data.likes) && 
                   res.data.likes.includes(currentUserId),
        };
        setPost(normalizedPost);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetchPost();
  }, [postId]);

  /* =========================
     PULL TO REFRESH
  ========================= */
  const handleRefresh = useCallback(() => {
    fetchPost();
  }, [postId]);

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);

  /* =========================
     OPEN COMMENTS
  ========================= */
  const handleOpenComments = () => {
    if (post) {
      navigation.navigate(ROUTES.COMMENTS, {
        postId: post._id,
        postOwnerId: post.user._id,
      });
    }
  };

  /* =========================
     RENDER
  ========================= */
  if (loading && !post) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#666" />
          <Text style={styles.errorText}>{error || 'Post not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPost}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* POST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
      >
        <FeedPost post={post} isVisible={true} />

        {/* COMMENTS BUTTON */}
        <TouchableOpacity
          style={styles.viewCommentsButton}
          onPress={handleOpenComments}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#0095F6" />
          <Text style={styles.viewCommentsText}>
            View all {post.comments?.length || 0} comments
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostDetailScreen;

/* =========================
   STYLES
========================= */
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
  viewCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 15,
    marginTop: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  viewCommentsText: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});