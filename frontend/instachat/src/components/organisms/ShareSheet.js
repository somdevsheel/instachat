import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ======================================================
 * SHARE SHEET
 * ======================================================
 * Instagram-style "Send to" bottom sheet.
 *
 * Usage:
 *   <ShareSheet
 *     visible={showShare}
 *     onClose={() => setShowShare(false)}
 *     contentType="post"          // 'post' | 'reel'
 *     contentId={post._id}
 *     contentPreview={{            // optional preview info
 *       image: post.media?.variants?.original,
 *       caption: post.caption,
 *     }}
 *   />
 */
export default function ShareSheet({
  visible,
  onClose,
  contentType,
  contentId,
  contentPreview,
}) {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});     // { [userId]: true }
  const [sent, setSent] = useState({});            // { [userId]: true }

  /* =========================
     LOAD RECENT CHATS / USERS
  ========================= */
  useEffect(() => {
    if (!visible) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        // Get recent chats — shows people they already talk to
        const res = await api.get('/chats');
        const chats = res.data?.data || [];

        // Get current user ID
        const meRes = await api.get('/auth/me');
        const myId = meRes.data?.data?._id;

        // Extract other participants
        const chatUsers = chats
          .map((chat) => {
            const other = chat.participants?.find((p) => p._id !== myId);
            if (!other) return null;
            return {
              _id: other._id,
              username: other.username,
              profilePicture: other.profilePicture,
              chatId: chat._id,
            };
          })
          .filter(Boolean);

        setUsers(chatUsers);
        setFiltered(chatUsers);
      } catch (err) {
        console.error('ShareSheet load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    // Reset state when opening
    setSent({});
    setSending({});
    setSearch('');
  }, [visible]);

  /* =========================
     SEARCH FILTER
  ========================= */
  const handleSearch = useCallback(
    (text) => {
      setSearch(text);
      if (!text.trim()) {
        setFiltered(users);
        return;
      }
      const q = text.toLowerCase();
      setFiltered(users.filter((u) => u.username.toLowerCase().includes(q)));
    },
    [users]
  );

  /* =========================
     SEND SHARE
  ========================= */
  const handleSend = useCallback(
    async (user) => {
      if (sending[user._id] || sent[user._id]) return;

      setSending((prev) => ({ ...prev, [user._id]: true }));

      try {
        // Get or create chat
        let chatId = user.chatId;
        if (!chatId) {
          const chatRes = await api.get(`/chats/with/${user._id}`);
          chatId = chatRes.data?.data?._id;
        }

        // Build message payload
        const payload = {
          chatId,
          receiverId: user._id,
          text: '',
        };

        if (contentType === 'post') {
          payload.sharedPostId = contentId;
        } else if (contentType === 'reel') {
          payload.sharedReelId = contentId;
        }

        await api.post('/chats/message', payload);

        setSent((prev) => ({ ...prev, [user._id]: true }));
      } catch (err) {
        console.error('Share error:', err);
        Alert.alert('Error', 'Failed to send. Try again.');
      } finally {
        setSending((prev) => ({ ...prev, [user._id]: false }));
      }
    },
    [contentType, contentId, sending, sent]
  );

  /* =========================
     RENDER USER ROW
  ========================= */
  const renderUser = ({ item }) => {
    const isSent = sent[item._id];
    const isSending = sending[item._id];

    return (
      <View style={styles.userRow}>
        <Image
          source={{
            uri: item.profilePicture || 'https://via.placeholder.com/44',
          }}
          style={styles.userAvatar}
        />
        <Text style={styles.userName} numberOfLines={1}>
          {item.username}
        </Text>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            isSent && styles.sentBtn,
          ]}
          onPress={() => handleSend(item)}
          disabled={isSending || isSent}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.sendBtnText, isSent && styles.sentBtnText]}>
              {isSent ? 'Sent' : 'Send'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTap} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Title */}
          <Text style={styles.title}>Send to</Text>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#666"
              value={search}
              onChangeText={handleSearch}
            />
          </View>

          {/* Content Preview */}
          {contentPreview?.image && (
            <View style={styles.previewRow}>
              <Image source={{ uri: contentPreview.image }} style={styles.previewThumb} />
              <Text style={styles.previewText} numberOfLines={1}>
                {contentPreview.caption || (contentType === 'reel' ? 'Reel' : 'Post')}
              </Text>
            </View>
          )}

          {/* User List */}
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#0095f6" />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {search ? 'No users found' : 'No recent chats yet'}
            </Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              renderItem={renderUser}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  overlayTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 34,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2e2e2e',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: 10,
    gap: 10,
  },
  previewThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  previewText: {
    color: '#aaa',
    fontSize: 13,
    flex: 1,
  },
  list: {
    marginTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  sendBtn: {
    backgroundColor: '#0095f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  sentBtn: {
    backgroundColor: '#333',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sentBtnText: {
    color: '#888',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
