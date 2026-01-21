import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import {
  getComments,
  addComment,
} from '../../api/Comments.api';
import { ROUTES } from '../../navigation/routes.constants';

const CommentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useSelector(state => state.auth);

  const { postId } = route.params || {};

  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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
      console.error('❌ Failed to load comments', err?.message);
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

    try {
      setSending(true);
      await addComment(postId, input.trim());
      setInput('');
      loadComments();
    } catch (err) {
      console.error('❌ Failed to add comment', err?.message);
    } finally {
      setSending(false);
    }
  };

  /* =========================
     NAVIGATE TO PROFILE
  ========================= */
  const handleUserPress = useCallback((username) => {
    if (!username) return;

    // Check if it's the current user's profile
    if (username === currentUser?.username) {
      // Navigate back to main tab's profile screen
      navigation.navigate(ROUTES.MAIN_TAB, { 
        screen: 'PROFILE_TAB' 
      });
    } else {
      // Navigate to other user's profile
      navigation.navigate(ROUTES.USER_PROFILE, { username });
    }
  }, [navigation, currentUser]);

  /* =========================
     RENDER ITEM
  ========================= */
  const renderItem = ({ item }) => (
    <View style={styles.commentRow}>
      {/* Clickable Avatar */}
      <TouchableOpacity
        onPress={() => handleUserPress(item?.user?.username)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri:
              item?.user?.profilePicture ||
              'https://via.placeholder.com/40',
          }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <View style={styles.commentBody}>
        {/* Clickable Username */}
        <TouchableOpacity
          onPress={() => handleUserPress(item?.user?.username)}
          activeOpacity={0.7}
        >
          <Text style={styles.username}>
            {item?.user?.username || 'User'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.commentText}>
          {item?.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Comments</Text>

          <View style={{ width: 22 }} />
        </View>

        {/* ================= LIST ================= */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  No comments yet
                </Text>
              </View>
            }
          />
        )}

        {/* ================= INPUT ================= */}
        <View style={styles.inputBar}>
          <Image
            source={{
              uri: currentUser?.profilePicture || 'https://via.placeholder.com/40',
            }}
            style={styles.inputAvatar}
          />

          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#1DA1F2" />
            ) : (
              <Ionicons
                name="send"
                size={22}
                color={input.trim() ? '#1DA1F2' : '#555'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CommentsScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
  },

  container: {
    flex: 1,
  },

  header: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 20,
  },

  commentRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  commentBody: {
    flex: 1,
  },

  username: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },

  commentText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 18,
  },

  empty: {
    marginTop: 40,
    alignItems: 'center',
  },

  emptyText: {
    color: '#777',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },

  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  input: {
    flex: 1,
    maxHeight: 120,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 6,
    paddingRight: 10,
  },
});