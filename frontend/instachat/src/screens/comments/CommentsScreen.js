import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { getComments, addComment } from '../../api/Comments.api';
import { ROUTES } from '../../navigation/routes.constants';

const CommentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useSelector(state => state.auth);

  const { postId } = route.params || {};

  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  /* ====================================================
     1️⃣ FIX: REMOVE WHITE NAVIGATION HEADER
  ==================================================== */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // This removes the "COMMENTS" header with the arrow
    });
  }, [navigation]);

  /* ====================================================
     2️⃣ FIX: KEYBOARD GAP (ANDROID VS IOS)
  ==================================================== */
  useEffect(() => {
    // 🚨 ANDROID FIX: Android automatically pushes the view up.
    // We MUST NOT add extra margin on Android, or you get a huge gap.
    if (Platform.OS === 'android') {
      return; 
    }

    // iOS Only: Manually animate the input bar up
    const showListener = Keyboard.addListener('keyboardWillShow', (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height - insets.bottom,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', (e) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [insets.bottom]);

  /* =========================
     FETCH COMMENTS
  ========================= */
  const loadComments = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const res = await getComments(postId);
      setComments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load comments:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  /* =========================
     ADD COMMENT
  ========================= */
  const handleSend = async () => {
    if (!input.trim() || sending || !postId) return;

    const commentText = input.trim();
    setInput('');

    try {
      setSending(true);
      await addComment(postId, commentText);
      await loadComments();
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (err) {
      console.error('Failed to add comment:', err?.message);
      setInput(commentText);
    } finally {
      setSending(false);
    }
  };

  /* =========================
     NAVIGATE TO PROFILE
  ========================= */
  const handleUserPress = useCallback((username) => {
    if (!username) return;

    if (username === currentUser?.username) {
      navigation.navigate(ROUTES.MAIN_TAB, { screen: 'PROFILE_TAB' });
    } else {
      navigation.navigate(ROUTES.USER_PROFILE, { username });
    }
  }, [navigation, currentUser]);

  /* =========================
     FORMAT TIME
  ========================= */
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
  };

  /* =========================
     RENDER COMMENT ITEM
  ========================= */
  const renderItem = ({ item }) => (
    <View style={styles.commentRow}>
      <TouchableOpacity onPress={() => handleUserPress(item?.user?.username)} activeOpacity={0.7}>
        <Image
          source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={() => handleUserPress(item?.user?.username)} activeOpacity={0.7}>
            <Text style={styles.username}>{item?.user?.username || 'User'}</Text>
          </TouchableOpacity>
          <Text style={styles.timeText}>{formatTime(item?.createdAt)}</Text>
        </View>

        <Text style={styles.commentText}>{item?.text}</Text>

        <TouchableOpacity style={styles.replyBtn}>
          <Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.likeBtn}>
        <Ionicons name="heart-outline" size={14} color="#888" />
        {item?.likesCount > 0 && <Text style={styles.likeCount}>{item.likesCount}</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    // Added paddingTop: insets.top to handle status bar area since we removed the header
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Handle Bar */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Header (Now this will be the main header) */}
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySubtitle}>Start the conversation.</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <Animated.View 
        style={[
          styles.inputBar, 
          { 
            // On Android, insets.bottom is usually 0. We add 12px padding.
            // On iOS, we add safe area padding.
            paddingBottom: Math.max(insets.bottom, 12),
            // On Android, this keyboardHeight is 0 (fixed above), removing the huge gap.
            marginBottom: keyboardHeight,
          }
        ]}
      >
        <Image
          source={{ uri: currentUser?.profilePicture || 'https://via.placeholder.com/40' }}
          style={styles.inputAvatar}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="What do you think of this?"
            placeholderTextColor="#666"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            blurOnSubmit={false}
          />
        </View>

        {input.trim() ? (
          <TouchableOpacity onPress={handleSend} disabled={sending} style={styles.sendBtn}>
            {sending ? (
              <ActivityIndicator size="small" color="#0095F6" />
            ) : (
              <Ionicons name="arrow-up-circle" size={32} color="#0095F6" />
            )}
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </View>
  );
};

export default CommentsScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#404040',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 8,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  replyBtn: {
    paddingVertical: 2,
  },
  replyText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  likeBtn: {
    alignItems: 'center',
    paddingLeft: 12,
    paddingTop: 4,
  },
  likeCount: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#404040',
    backgroundColor: '#262626',
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#404040',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginRight: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});