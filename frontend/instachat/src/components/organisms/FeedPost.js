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

import { likePost, deletePost, savePost } from '../../api/Posts.api';
import { ROUTES } from '../../navigation/routes.constants';
import { getSocket } from '../../services/socket';
import colors from '../../theme/colors';
import ReportModal from '../ReportModal';
import ShareSheet from '../organisms/ShareSheet';

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
};

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 24;
const MEDIA_HEIGHT = CARD_WIDTH * 1.25;

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
  const [saved, setSaved] = useState(!!post?.isSaved);

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
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
     SAVE HANDLER
  ========================= */
  const handleSave = async () => {
    setSaved(v => !v);
    try {
      await savePost(post._id);
    } catch {
      setSaved(v => !v);
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
    // Own profile → switch to Profile tab
    if (user?._id === currentUserId) {
      navigation.navigate(ROUTES.MAIN_TAB, {
        screen: ROUTES.PROFILE,
      });
      return;
    }

    // Other user → must have username
    if (!user?.username) return;

    navigation.navigate(ROUTES.USER_PROFILE, {
      username: user.username,
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
          <View>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>
                {user.username || 'User'}
              </Text>
              {!!user.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.accent}
                  style={styles.verifiedBadge}
                />
              )}
            </View>
            {!!post.location && (
              <Text style={styles.location}>{post.location}</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={openMenu}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textSecondary}
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
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.accentPink : colors.textSecondary}
          />
          <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
            {formatCount(likesCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={openComments}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.actionText}>{post.commentsCount || ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowShare(true)}>
          <Ionicons
            name="paper-plane-outline"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={handleSave}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.likes}>
          {formatCount(likesCount)} {likesCount === 1 ? 'like' : 'likes'}
        </Text>

        {!!post.caption && (
          <Text style={styles.caption}>
            <Text style={styles.username}>
              {user.username}{' '}
            </Text>
            {post.caption}
          </Text>
        )}

        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={openComments}>
            <Text style={styles.viewComments}>View all comments</Text>
          </TouchableOpacity>
        )}

        {!!post.createdAt && (
          <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
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
                  onPress={() => {
                    closeMenu();
                    setTimeout(() => setShowReport(true), 300);
                  }}
                >
                  <Text style={[styles.menuText, { color: colors.danger }]}>Report</Text>
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

      {/* REPORT MODAL */}
      <ReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        targetType="post"
        targetId={post._id}
      />

      {/* SHARE SHEET */}
      <ShareSheet
        visible={showShare}
        onClose={() => setShowShare(false)}
        contentType="post"
        contentId={post._id}
        contentPreview={{
          image: media?.variants?.original,
          caption: post.caption,
        }}
      />
    </View>
  );
};

export default memo(FeedPost);

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },

  username: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  verifiedBadge: {
    marginLeft: 4,
  },

  location: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },

  mediaContainer: {
    width: '100%',
    height: MEDIA_HEIGHT,
    backgroundColor: colors.surfaceRaised,
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
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  actionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  actionTextLiked: {
    color: colors.accentPink,
  },

  footer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
  },

  likes: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },

  caption: {
    color: colors.textPrimary,
    lineHeight: 18,
  },

  viewComments: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  timestamp: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: 6,
  },

  // Menu Modal Styles
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  menuSheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },

  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  menuText: {
    color: colors.textPrimary,
    fontSize: 16,
  },

  deleteText: {
    color: colors.danger,
    fontWeight: '600',
  },

  menuDivider: {
    height: 0.5,
    backgroundColor: colors.border,
  },
});
