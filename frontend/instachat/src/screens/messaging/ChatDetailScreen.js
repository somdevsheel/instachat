// import { SafeAreaView } from 'react-native-safe-area-context';
// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Image,
//   Alert,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchMessages,
//   sendMessage,
//   setActiveChat,
//   addMessage,
//   messageDeleted,
//   markChatRead,
// } from '../../redux/slices/chatSlice';
// import MessageBubble from '../../components/molecules/MessageBubble';
// import colors from '../../theme/colors';
// import { Ionicons } from '@expo/vector-icons';
// import { getSocket } from '../../services/socket';
// import api from '../../services/api';

// /* 🔐 E2EE - Use the proper encryptMessage function */
// import { encryptMessage } from '../../utils/crypto';

// const HEADER_HEIGHT = 56;

// const ChatDetailScreen = ({ route, navigation }) => {
//   const { chatId, username, receiverId } = route.params || {};

//   const dispatch = useDispatch();
//   const flatListRef = useRef(null);
//   const typingTimeoutRef = useRef(null);

//   const [text, setText] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const [sending, setSending] = useState(false);

//   const { messages, loading } = useSelector(state => state.chat);
//   const { user } = useSelector(state => state.auth);

//   const socket = getSocket();

//   /* =========================
//      GUARD
//   ========================= */
//   useEffect(() => {
//     if (!chatId || !receiverId) {
//       Alert.alert('Error', 'Invalid chat');
//       navigation.goBack();
//     }
//   }, [chatId, receiverId]);

//   /* =========================
//      MARK AS READ
//   ========================= */
//   useEffect(() => {
//     if (!chatId) return;
//     api.post(`/chats/${chatId}/read`).catch(() => {});
//   }, [chatId]);

//   /* =========================
//      LOAD CHAT + SOCKET
//   ========================= */
//   useEffect(() => {
//     if (!chatId || !socket) return;

//     dispatch(setActiveChat(chatId));
//     dispatch(fetchMessages(chatId));

//     socket.emit('join_chat', chatId);

//     socket.on('message_received', msg => {
//       dispatch(addMessage(msg));
//     });

//     socket.on('messages_read', ({ chatId: readChatId, readerId }) => {
//       if (readChatId === chatId) {
//         dispatch(markChatRead({ readerId, myUserId: user._id }));
//       }
//     });

//     socket.on('message_deleted', payload => {
//       dispatch(messageDeleted(payload));
//     });

//     socket.on('typing', () => setIsTyping(true));
//     socket.on('stop_typing', () => setIsTyping(false));

//     return () => {
//       dispatch(setActiveChat(null));
//       socket.off('message_received');
//       socket.off('messages_read');
//       socket.off('message_deleted');
//       socket.off('typing');
//       socket.off('stop_typing');
//     };
//   }, [chatId]);

//   /* =========================
//      AUTO SCROLL
//   ========================= */
//   useEffect(() => {
//     if (messages.length > 0) {
//       requestAnimationFrame(() =>
//         flatListRef.current?.scrollToEnd({ animated: true })
//       );
//     }
//   }, [messages]);

//   /* =========================
//      TYPING HANDLER
//   ========================= */
//   const handleTyping = value => {
//     setText(value);

//     if (!socket || !chatId) return;

//     socket.emit('typing', chatId);
//     clearTimeout(typingTimeoutRef.current);

//     typingTimeoutRef.current = setTimeout(() => {
//       socket.emit('stop_typing', chatId);
//     }, 800);
//   };

//   /* =========================
//      ✅ FIXED: SEND MESSAGE (MULTI-DEVICE E2EE)
//   ========================= */
//   const handleSend = async () => {
//     if (!text.trim() || sending) return;

//     const plainText = text.trim();
//     setText(''); // Clear immediately for better UX
//     setSending(true);

//     try {
//       // ✅ Use the proper encryptMessage function
//       const encryptedPayloads = await encryptMessage({
//         text: plainText,
//         receiverId,
//       });

//       console.log('📦 Encrypted payloads:', encryptedPayloads);

//       // ✅ Dispatch with correct structure + plaintext for local display
//       await dispatch(
//         sendMessage({
//           chatId,
//           receiverId,
//           encryptedPayloads,
//           plaintext: plainText, // ✅ Store so we can display our own messages
//         })
//       );

//       // Stop typing indicator
//       socket?.emit('stop_typing', chatId);

//     } catch (err) {
//       console.error('❌ Send error:', err);
      
//       Alert.alert(
//         'Message failed',
//         err.message || 'Unable to send message. Please try again.'
//       );
      
//       // Restore text on failure
//       setText(plainText);
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>

//         <View style={styles.headerInfo}>
//           <Image
//             source={{ uri: 'https://via.placeholder.com/40' }}
//             style={styles.avatar}
//           />
//           <Text style={styles.username}>{username}</Text>
//         </View>

//         <Ionicons name="lock-closed" size={18} color={colors.primary} />
//       </View>

//       {/* BODY */}
//       <KeyboardAvoidingView
//         style={styles.flex}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_HEIGHT : 0}
//       >
//         {loading && messages.length === 0 ? (
//           <ActivityIndicator
//             size="large"
//             color={colors.primary}
//             style={{ marginTop: 20 }}
//           />
//         ) : (
//           <FlatList
//             ref={flatListRef}
//             data={messages}
//             renderItem={({ item }) => (
//               <MessageBubble
//                 message={item}
//                 isOwnMessage={
//                   (item.sender?._id || item.sender) === user._id
//                 }
//               />
//             )}
//             keyExtractor={item => item._id}
//             contentContainerStyle={styles.list}
//             showsVerticalScrollIndicator={false}
//           />
//         )}

//         {isTyping && (
//           <Text style={styles.typingText}>{username} is typing…</Text>
//         )}

//         {/* INPUT BAR */}
//         <View style={styles.inputBar}>
//           <TextInput
//             style={styles.input}
//             placeholder="Message..."
//             value={text}
//             onChangeText={handleTyping}
//             multiline
//             editable={!sending}
//           />

//           <TouchableOpacity
//             onPress={handleSend}
//             disabled={!text.trim() || sending}
//           >
//             {sending ? (
//               <ActivityIndicator
//                 size="small"
//                 color={colors.primary}
//                 style={{ paddingHorizontal: 6 }}
//               />
//             ) : (
//               <Text
//                 style={[
//                   styles.sendText,
//                   !text.trim() && { opacity: 0.4 },
//                 ]}
//               >
//                 Send
//               </Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default ChatDetailScreen;

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },

//   flex: {
//     flex: 1,
//   },

//   header: {
//     height: HEADER_HEIGHT,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },

//   headerInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginRight: 8,
//     backgroundColor: '#eee',
//   },

//   username: {
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   list: {
//     padding: 12,
//     paddingBottom: 8,
//   },

//   typingText: {
//     fontSize: 12,
//     color: '#888',
//     marginLeft: 16,
//     marginBottom: 4,
//   },

//   inputBar: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     paddingHorizontal: 8,
//     paddingVertical: 6,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     backgroundColor: '#fff',
//   },

//   input: {
//     flex: 1,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 20,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     marginRight: 8,
//     fontSize: 16,
//     maxHeight: 120,
//   },

//   sendText: {
//     color: colors.primary,
//     fontWeight: '600',
//     fontSize: 16,
//     paddingHorizontal: 6,
//     paddingBottom: 6,
//   },
// });






import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
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
  setActiveChat,
  addMessage,
  messageDeleted,
  markChatRead,
} from '../../redux/slices/chatSlice';
import MessageBubble from '../../components/molecules/MessageBubble';
import colors from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { encryptMessage } from '../../utils/crypto';

const ChatDetailScreen = ({ route, navigation }) => {
  // Safely extract params with fallback
  const chatId = route?.params?.chatId;
  const username = route?.params?.username || 'User';
  const receiverId = route?.params?.receiverId;
  const profilePicture = route?.params?.profilePicture;

  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const { messages, loading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  const socket = getSocket();

  /* =========================
     GUARD
  ========================= */
  useEffect(() => {
    if (!chatId || !receiverId) {
      Alert.alert('Error', 'Invalid chat');
      navigation.goBack();
    }
  }, [chatId, receiverId]);

  /* =========================
     MARK AS READ
  ========================= */
  useEffect(() => {
    if (!chatId) return;
    api.post(`/chats/${chatId}/read`).catch(() => {});
  }, [chatId]);

  /* =========================
     LOAD CHAT + SOCKET
  ========================= */
  useEffect(() => {
    if (!chatId || !socket) return;

    dispatch(setActiveChat(chatId));
    dispatch(fetchMessages(chatId));

    socket.emit('join_chat', chatId);

    socket.on('message_received', msg => {
      dispatch(addMessage(msg));
    });

    socket.on('messages_read', ({ chatId: readChatId, readerId }) => {
      if (readChatId === chatId) {
        dispatch(markChatRead({ readerId, myUserId: user._id }));
      }
    });

    socket.on('message_deleted', payload => {
      dispatch(messageDeleted(payload));
    });

    socket.on('typing', () => setIsTyping(true));
    socket.on('stop_typing', () => setIsTyping(false));

    return () => {
      dispatch(setActiveChat(null));
      socket.off('message_received');
      socket.off('messages_read');
      socket.off('message_deleted');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [chatId]);

  /* =========================
     AUTO SCROLL
  ========================= */
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() =>
        flatListRef.current?.scrollToEnd({ animated: true })
      );
    }
  }, [messages]);

  /* =========================
     TYPING HANDLER
  ========================= */
  const handleTyping = value => {
    setText(value);

    if (!socket || !chatId) return;

    socket.emit('typing', chatId);
    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', chatId);
    }, 800);
  };

  /* =========================
     SEND MESSAGE
  ========================= */
  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const plainText = text.trim();
    setText('');
    setSending(true);

    try {
      const encryptedPayloads = await encryptMessage({
        text: plainText,
        receiverId,
      });

      await dispatch(
        sendMessage({
          chatId,
          receiverId,
          encryptedPayloads,
          plaintext: plainText,
        })
      );

      socket?.emit('stop_typing', chatId);
    } catch (err) {
      console.error('❌ Send error:', err);
      Alert.alert(
        'Message failed',
        err.message || 'Unable to send message. Please try again.'
      );
      setText(plainText);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER - Instagram Style */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter}>
          <Image
            source={{
              uri: profilePicture || 'https://via.placeholder.com/40',
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{username}</Text>
            <Text style={styles.headerUsername}>
              {username?.toLowerCase().replace(/\s/g, '.')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="call-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="videocam-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MESSAGES */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.messagesContainer}>
          {loading && messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  isOwnMessage={
                    (item.sender?._id || item.sender) === user._id
                  }
                />
              )}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>typing...</Text>
            </View>
          )}
        </View>

        {/* INPUT BAR - Instagram Style */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={handleTyping}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            
            {!text.trim() ? (
              <View style={styles.inputActions}>
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="mic-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="image-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="happy-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#0095f6" />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.plusButton}>
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

/* =========================
   STYLES - INSTAGRAM DARK THEME
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },

  backButton: {
    padding: 4,
    marginRight: 8,
  },

  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#262626',
  },

  headerTextContainer: {
    flex: 1,
  },

  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },

  headerUsername: {
    fontSize: 12,
    color: '#a8a8a8',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconButton: {
    padding: 8,
    marginLeft: 4,
  },

  keyboardView: {
    flex: 1,
  },

  messagesContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },

  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },

  typingText: {
    fontSize: 13,
    color: '#a8a8a8',
    fontStyle: 'italic',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#000',
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
  },

  cameraButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },

  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#262626',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },

  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },

  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  inputIcon: {
    padding: 4,
    marginLeft: 8,
  },

  sendButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },

  sendText: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },

  plusButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});