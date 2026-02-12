import React, { useRef, useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { likePost, deletePost } from '../../api/Posts.api';
import { ROUTES } from '../../navigation/routes.constants';
import { getSocket } from '../../services/socket';
import colors from '../../theme/colors';

const { width } = Dimensions.get('window');
const MEDIA_HEIGHT = width * 1.25;

// Instagram-style global mute
let globalMute = true;

const FeedPost = ({ post, isVisible = true, onPostDeleted }) => {
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const lastTapRef = useRef(0);

  const currentUserId = useSelector(
    state => state.auth?.user?._id
  );

  const user = post?.user || {};
  const media = post?.media || {};
  const mediaUrl = media?.variants?.original;

  /* =========================
     LIKE STATE (SOURCE OF TRUTH)
  ========================= */
  const backendLiked =
    Array.isArray(post?.likes) &&
    currentUserId &&
    post.likes.includes(currentUserId);

  const [liked, setLiked] = useState(backendLiked);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);

  /* =========================
     VIDEO STATE
  ========================= */
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(globalMute);

  /* =========================
     MENU STATE
  ========================= */
  const [menuVisible, setMenuVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* =========================
     SYNC ON FEED UPDATE
  ========================= */
  useEffect(() => {
    setLiked(backendLiked);
    setLikesCount(post?.likesCount || 0);
  }, [backendLiked, post?.likesCount]);

  /* =========================
     REAL-TIME LIKE (SOCKET)
  ========================= */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = data => {
      if (data.postId !== post._id) return;

      setLikesCount(data.likesCount);
      if (data.userId === currentUserId) {
        setLiked(data.liked);
      }
    };

    socket.on('post_like_updated', handler);
    return () => socket.off('post_like_updated', handler);
  }, [post._id, currentUserId]);

  /* =========================
     AUTO PLAY / PAUSE (SCROLL)
  ========================= */
  useEffect(() => {
    if (media.type !== 'video' || !videoRef.current) return;

    if (isVisible) {
      videoRef.current.playAsync().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pauseAsync().catch(() => {});
      setIsPlaying(false);
    }
  }, [isVisible, media.type]);

  /* =========================
     LIKE HANDLER
  ========================= */
  const handleLike = async () => {
    const nextLiked = !liked;

    setLiked(nextLiked);
    setLikesCount(c => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await likePost(post._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setLiked(backendLiked);
      setLikesCount(post?.likesCount || 0);
    }
  };

  /* =========================
     DOUBLE TAP LIKE
  ========================= */
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && !liked) {
      handleLike();
    }
    lastTapRef.current = now;
  };

  /* =========================
     VIDEO CONTROLS
  ========================= */
  const togglePlay = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    globalMute = !globalMute;
    setIsMuted(globalMute);

    // Android safety: resume playback
    if (isVisible && videoRef.current) {
      videoRef.current.playAsync().catch(() => {});
      setIsPlaying(true);
    }
  };

  /* =========================
     NAVIGATION
  ========================= */
  const openProfile = () => {
    if (!user?._id) return;
    navigation.navigate(ROUTES.USER_PROFILE, {
      userId: user._id,
    });
  };

  const openComments = () => {
    navigation.navigate(ROUTES.COMMENTS, {
      postId: post._id,
    });
  };

  /* =========================
     MENU HANDLERS
  ========================= */
  const openMenu = () => {
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleDeletePress = () => {
    closeMenu();
    
    Alert.alert(
      'Delete post?',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deletePost(post._id);
              onPostDeleted?.(post._id);
            } catch (error) {
              console.error('Delete error:', error);
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isOwnPost = user._id === currentUserId;

  if (!mediaUrl || isDeleting) return null;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={openProfile}>
          <Image
            source={{
              uri: user.profilePicture || 'https://via.placeholder.com/40',
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>
            {user.username || 'User'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openMenu}>
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* MEDIA */}
      <Pressable onPress={handleDoubleTap}>
        <View style={styles.mediaContainer}>
          {media.type === 'image' && (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.media}
            />
          )}

          {media.type === 'video' && (
            <TouchableOpacity
              style={styles.media}
              activeOpacity={1}
              onPress={togglePlay}
            >
              <Video
                ref={videoRef}
                source={{ uri: mediaUrl }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                isLooping
                isMuted={isMuted}
                shouldPlay={false}
              />

              {!isPlaying && (
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={48} color="#fff" />
                </View>
              )}

              <TouchableOpacity
                style={styles.muteButton}
                onPress={toggleMute}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={26}
            color={liked ? '#ff3040' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={openComments}>
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.likes}>
          {likesCount} likes
        </Text>

        {!!post.caption && (
          <Text style={styles.caption}>
            <Text style={styles.username}>
              {user.username}{' '}
            </Text>
            {post.caption}
          </Text>
        )}
      </View>

      {/* MENU MODAL */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <View 
            style={styles.menuSheet}
            onStartShouldSetResponder={() => true}
          >
            {isOwnPost ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDeletePress}
                >
                  <Text style={[styles.menuText, styles.deleteText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={closeMenu}
                >
                  <Text style={styles.menuText}>Report</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={closeMenu}
                >
                  <Text style={styles.menuText}>Unfollow</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={closeMenu}
            >
              <Text style={styles.menuText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default memo(FeedPost);

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  username: {
    color: '#fff',
    fontWeight: '600',
  },

  mediaContainer: {
    width,
    height: MEDIA_HEIGHT,
    backgroundColor: '#000',
  },

  media: {
    width: '100%',
    height: '100%',
  },

  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 20,
  },

  footer: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },

  likes: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },

  caption: {
    color: '#fff',
    lineHeight: 18,
  },

  // Menu Modal Styles
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  menuSheet: {
    backgroundColor: '#262626',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },

  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  menuText: {
    color: '#fff',
    fontSize: 16,
  },

  deleteText: {
    color: '#FF3B30',
    fontWeight: '600',
  },

  menuDivider: {
    height: 0.5,
    backgroundColor: '#444',
  },
});