/**
 * ChatListItem.js
 * + Shared Post/Reel preview support
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const compactTimeAgo = (dateString) => {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
};

const ChatListItem = ({ chat, otherUser, currentUserId, onPress }) => {
  const lastMessage = chat.lastMessage;

  const isSentByMe =
    lastMessage &&
    (typeof lastMessage.sender === 'string'
      ? lastMessage.sender === currentUserId
      : lastMessage.sender?._id === currentUserId);

  /* =========================
     PREVIEW TEXT (SYNC)
  ========================= */
  let previewText = 'Start chatting';
  let previewIcon = null;

  if (lastMessage) {
    if (lastMessage.deletedForEveryone) {
      previewText = '🚫 Message deleted';
    } else if (lastMessage.type === 'shared_post') {
      previewText = isSentByMe ? 'You shared a post' : 'Shared a post';
      previewIcon = 'image-outline';
    } else if (lastMessage.type === 'shared_reel') {
      previewText = isSentByMe ? 'You shared a reel' : 'Shared a reel';
      previewIcon = 'film-outline';
    } else if (lastMessage.type === 'image') {
      previewText = lastMessage.text?.trim()
        ? (isSentByMe ? `You: ${lastMessage.text}` : lastMessage.text)
        : (isSentByMe ? 'You sent a photo' : 'Sent a photo');
      previewIcon = 'image-outline';
    } else if (lastMessage.type === 'video') {
      previewText = lastMessage.text?.trim()
        ? (isSentByMe ? `You: ${lastMessage.text}` : lastMessage.text)
        : (isSentByMe ? 'You sent a video' : 'Sent a video');
      previewIcon = 'videocam-outline';
    } else if (lastMessage.story) {
      previewText = isSentByMe ? 'You replied to a story' : 'Replied to your story';
    } else if (typeof lastMessage.text === 'string' && lastMessage.text.trim()) {
      previewText = isSentByMe
        ? `You: ${lastMessage.text}`
        : lastMessage.text;
    } else {
      previewText = 'Message';
    }
  }

  /* =========================
     TIME / UNREAD
  ========================= */
  const timeText = lastMessage ? compactTimeAgo(lastMessage.createdAt) : '';
  const unreadCount = chat.unreadCount || 0;
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image
          source={{
            uri: otherUser?.profilePicture || 'https://via.placeholder.com/100',
          }}
          style={styles.avatar}
        />
        {otherUser?.online && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.middle}>
        <View style={styles.topLine}>
          <Text style={styles.username} numberOfLines={1}>
            {otherUser?.username || 'User'}
          </Text>
          {!!timeText && (
            <Text style={[styles.time, isUnread && styles.timeUnread]}>
              {timeText}
            </Text>
          )}
        </View>

        <View style={styles.bottomLine}>
          {previewIcon && (
            <Ionicons
              name={previewIcon}
              size={14}
              color={colors.accent}
              style={{ marginRight: 4 }}
            />
          )}
          <Text
            style={[styles.preview, isUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {previewText}
          </Text>

          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChatListItem;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.bg,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceRaised,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  middle: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  username: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '75%',
  },
  time: {
    color: colors.textFaint,
    fontSize: 12,
  },
  timeUnread: {
    color: colors.accent,
    fontWeight: '600',
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  preview: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  previewUnread: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
