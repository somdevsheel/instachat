/**
 * ChatDetailScreen.js
 * FINAL – LOOP SAFE – PLAIN TEXT ONLY
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  sendMessage,
  addMessage,
  messageDeleted,
} from '../../redux/slices/chatSlice';
import MessageBubble from '../../components/molecules/MessageBubble';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../services/socket';
import api from '../../services/api';

const ChatDetailScreen = ({ route, navigation }) => {
  const { chatId, username = 'User', receiverId, profilePicture } =
    route?.params || {};

  const dispatch = useDispatch();
  const socket = getSocket();

  const flatListRef = useRef(null);
  const initializedRef = useRef(false);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const { messages, loading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  /* =========================
     PARAM VALIDATION
  ========================= */
  useEffect(() => {
    if (!chatId || !receiverId) {
      Alert.alert('Error', 'Invalid chat');
      navigation.goBack();
    }
  }, [chatId, receiverId, navigation]);

  /* =========================
     LOAD MESSAGES (ONCE PER CHAT)
  ========================= */
  useEffect(() => {
    if (!chatId || initializedRef.current) return;

    initializedRef.current = true;
    dispatch(fetchMessages(chatId));

    // Mark read (fire and forget)
    api.post(`/chats/${chatId}/read`).catch(() => {});

    // Join socket room
    if (socket) {
      socket.emit('join_chat', chatId);
    }

    return () => {
      initializedRef.current = false;
      if (socket) {
        socket.emit('leave_chat', chatId);
      }
    };
  }, [chatId, dispatch, socket]);

  /* =========================
     SOCKET LISTENERS (ATTACH ONCE)
  ========================= */
  useEffect(() => {
    if (!socket) return;

    const onMessage = message => {
      dispatch(addMessage(message));
    };

    const onDelete = payload => {
      dispatch(messageDeleted(payload));
    };

    const onTyping = () => setTyping(true);
    const onStopTyping = () => setTyping(false);

    socket.on('message_received', onMessage);
    socket.on('message_deleted', onDelete);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);

    return () => {
      socket.off('message_received', onMessage);
      socket.off('message_deleted', onDelete);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [socket, dispatch]);

  /* =========================
     AUTO SCROLL (SAFE)
  ========================= */
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  /* =========================
     SEND MESSAGE (PLAIN TEXT)
  ========================= */
  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      await dispatch(
        sendMessage({
          chatId,
          receiverId,
          text: messageText,
        })
      );
      socket?.emit('stop_typing', chatId);
    } catch (e) {
      Alert.alert('Failed', 'Message not sent');
      setText(messageText);
    }

    setSending(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: profilePicture || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{username}</Text>
      </View>

      {/* CHAT BODY */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={{ flex: 1 }}>
          {loading && messages.length === 0 ? (
            <ActivityIndicator style={{ flex: 1 }} color="#fff" />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  isOwnMessage={
                    (item.sender?._id || item.sender) === user._id
                  }
                />
              )}
              contentContainerStyle={{ padding: 12, flexGrow: 1 }}
            />
          )}

          {typing && <Text style={styles.typing}>typing...</Text>}
        </View>

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            multiline
            editable={!sending}
          />
          {text.trim() ? (
            <TouchableOpacity onPress={handleSend} disabled={sending}>
              {sending ? (
                <ActivityIndicator color="#0095f6" />
              ) : (
                <Text style={styles.send}>Send</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 10,
    backgroundColor: '#262626',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  typing: {
    color: '#888',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
  },
  input: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  send: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    marginBottom: 10,
  },
});
