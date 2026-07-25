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
  Modal,
  Pressable,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchMessages,
  sendMessage,
  addMessage,
  messageDeleted,
  markChatRead,
} from '../../redux/slices/chatSlice';
import MessageBubble from '../../components/molecules/MessageBubble';
import { Ionicons } from '@expo/vector-icons';
import {
  initSocket,
  joinChatRoom,
  leaveChatRoom,
  emitTyping,
  emitStopTyping,
} from '../../services/socket';
import { markChatRead as markChatReadApi } from '../../api/Chat.api';
import api from '../../services/api';
import colors from '../../theme/colors';
import { uploadChatMedia } from '../../utils/uploadChatMedia';

const ChatDetailScreen = ({ route, navigation }) => {
  const {
    chatId,
    username = 'User',
    receiverId,
    profilePicture,
  } = route?.params || {};

  const dispatch = useDispatch();

  const flatListRef = useRef(null);
  const initializedRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] = useState(null);

  const { messages, loading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  /* =========================
     VALIDATION
  ========================= */
  useEffect(() => {
    if (!chatId || !receiverId) {
      Alert.alert('Error', 'Invalid chat');
      navigation.goBack();
    }
  }, [chatId, receiverId, navigation]);

  /* =========================
     LOAD MESSAGES
  ========================= */
  useEffect(() => {
    if (!chatId || initializedRef.current) return;

    initializedRef.current = true;
    dispatch(fetchMessages(chatId));

    api.post(`/chats/${chatId}/read`).catch(() => {});

    joinChatRoom(chatId);

    return () => {
      initializedRef.current = false;
      leaveChatRoom(chatId);

      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitStopTyping(chatId);
      }
    };
  }, [chatId, dispatch]);

  /* =========================
     MARK NEW MESSAGES AS READ
     Runs whenever the message list changes — covers both opening the
     chat and new messages arriving while it's already open. Without
     this, the other participant's "seen" tick never updates once the
     initial history has been marked read.
  ========================= */
  useEffect(() => {
    if (chatId && messages.length > 0) {
      markChatReadApi(chatId).catch(() => {});
    }
  }, [messages, chatId]);

  /* =========================
     SOCKET EVENTS
  ========================= */
  useEffect(() => {
    const onMessage = msg => dispatch(addMessage(msg));
    const onDelete = payload => dispatch(messageDeleted(payload));

    // Fired when the other participant reads what I've sent in this chat.
    const onRead = (data) => {
      if (data.chatId === chatId) {
        dispatch(markChatRead({ readerId: data.readerId, myUserId: user?._id }));
      }
    };

    const onTyping = () => setTyping(true);
    const onStopTyping = () => setTyping(false);

    // initSocket() resolves once the real connection is ready — reading
    // getSocket() synchronously here would often return null (the socket
    // is still awaiting its token lookup right after login/app boot),
    // silently skipping these listeners for the rest of this mount.
    let cancelled = false;
    let boundSocket = null;

    initSocket().then((socket) => {
      if (cancelled || !socket) return;
      boundSocket = socket;
      socket.on('message_received', onMessage);
      socket.on('message_deleted', onDelete);
      socket.on('messages_read', onRead);
      socket.on('typing', onTyping);
      socket.on('stop_typing', onStopTyping);
    });

    return () => {
      cancelled = true;
      boundSocket?.off('message_received', onMessage);
      boundSocket?.off('message_deleted', onDelete);
      boundSocket?.off('messages_read', onRead);
      boundSocket?.off('typing', onTyping);
      boundSocket?.off('stop_typing', onStopTyping);
    };
  }, [chatId, dispatch, user?._id]);

  /* =========================
     AUTO SCROLL
  ========================= */
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  /* =========================
     TYPING (EMIT)
  ========================= */
  const stopTypingNow = () => {
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitStopTyping(chatId);
    }
  };

  const handleTextChange = (value) => {
    setText(value);

    if (!value.trim()) {
      stopTypingNow();
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(chatId);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTypingNow, 2000);
  };

  /* =========================
     ATTACHMENT (PICK)
  ========================= */
  const handlePickAttachment = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your media');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    setPendingAttachment(result.assets[0]);
  };

  /* =========================
     SEND MESSAGE
  ========================= */
  const handleSend = async () => {
    if ((!text.trim() && !pendingAttachment) || sending || uploadingAttachment) return;

    const messageText = text.trim();
    stopTypingNow();

    let attachment;
    if (pendingAttachment) {
      setUploadingAttachment(true);
      try {
        const { key, mediaType } = await uploadChatMedia(pendingAttachment);
        attachment = { type: mediaType, originalKey: key };
      } catch {
        setUploadingAttachment(false);
        Alert.alert('Failed', 'Could not upload attachment');
        return;
      }
      setUploadingAttachment(false);
    }

    setText('');
    setPendingAttachment(null);
    setSending(true);

    try {
      await dispatch(
        sendMessage({
          chatId,
          receiverId,
          text: messageText,
          attachment,
        })
      );
    } catch {
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
          source={{
            uri: profilePicture || 'https://via.placeholder.com/40',
          }}
          style={styles.avatar}
        />

        <Text style={styles.name}>{username}</Text>
      </View>

      {/* BODY */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
      >
        <View style={{ flex: 1 }}>
          {loading && messages.length === 0 ? (
            <ActivityIndicator
              style={{ flex: 1 }}
              color={colors.accent}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  isOwnMessage={
                    (item.sender?._id || item.sender) ===
                    user._id
                  }
                  onOpenAttachment={setLightboxAttachment}
                />
              )}
              contentContainerStyle={{
                padding: 12,
                paddingBottom: 20,
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {typing && (
            <Text style={styles.typing}>typing…</Text>
          )}
        </View>

        {/* ATTACHMENT PREVIEW */}
        {pendingAttachment && (
          <View style={styles.attachmentPreviewBar}>
            <Image
              source={{ uri: pendingAttachment.uri }}
              style={styles.attachmentPreviewThumb}
            />
            {pendingAttachment.type === 'video' && (
              <View style={styles.attachmentPreviewPlayBadge}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            )}
            <Text style={styles.attachmentPreviewText} numberOfLines={1}>
              {uploadingAttachment ? 'Uploading…' : 'Ready to send'}
            </Text>
            <TouchableOpacity
              onPress={() => setPendingAttachment(null)}
              disabled={uploadingAttachment}
            >
              <Ionicons name="close-circle" size={22} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handlePickAttachment}
            disabled={sending || uploadingAttachment}
          >
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={handleTextChange}
            multiline
            editable={!sending}
          />

          {(text.trim() || pendingAttachment) && (
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || uploadingAttachment}
            >
              {sending || uploadingAttachment ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.send}>Send</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ATTACHMENT LIGHTBOX */}
      <Modal
        visible={!!lightboxAttachment}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxAttachment(null)}
      >
        <Pressable
          style={styles.lightboxBackdrop}
          onPress={() => setLightboxAttachment(null)}
        >
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightboxAttachment(null)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <Pressable onPress={() => {}}>
            {lightboxAttachment?.type === 'video' ? (
              <Video
                source={{ uri: lightboxAttachment.variants?.original }}
                style={styles.lightboxMedia}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
              />
            ) : (
              <Image
                source={{ uri: lightboxAttachment?.variants?.original }}
                style={styles.lightboxMedia}
                resizeMode="contain"
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 10,
    backgroundColor: colors.surfaceRaised,
  },

  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },

  typing: {
    color: colors.accent,
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
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },

  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4,
  },

  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 16,
    maxHeight: 120,
  },

  send: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    marginBottom: 10,
  },

  attachmentPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },

  attachmentPreviewThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },

  attachmentPreviewPlayBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  attachmentPreviewText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },

  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lightboxMedia: {
    width: '100%',
    height: '80%',
  },

  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
