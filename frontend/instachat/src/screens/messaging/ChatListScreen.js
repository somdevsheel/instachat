// import api from '../../services/api';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import React, { useCallback, useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import { useFocusEffect } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';

// import { fetchChats } from '../../redux/slices/chatSlice';
// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// /* 🔐 E2EE */
// import { decryptMessage } from '../../utils/crypto';

// const ChatListItemRow = ({ chat, currentUser, onPress }) => {
//   const [preview, setPreview] = useState('Start chat');
//   const [decrypting, setDecrypting] = useState(false);

//   const otherUser = chat.participants.find(
//     p => p._id !== currentUser._id
//   );

//   useEffect(() => {
//     let mounted = true;

//     const loadPreview = async () => {
//       if (!chat.lastMessage) {
//         setPreview('Start chat');
//         return;
//       }

//       if (chat.lastMessage.deletedForEveryone) {
//         setPreview('Message deleted');
//         return;
//       }

//       if (!chat.lastMessage.cipherText || !chat.lastMessage.nonce) {
//         setPreview('Encrypted message');
//         return;
//       }

//       try {
//         setDecrypting(true);

//         const senderId =
//           typeof chat.lastMessage.sender === 'string'
//             ? chat.lastMessage.sender
//             : chat.lastMessage.sender?._id;

//         const text = await decryptMessage({
//           cipherText: chat.lastMessage.cipherText,
//           nonce: chat.lastMessage.nonce,
//           senderId,
//         });

//         if (mounted) {
//           setPreview(text);
//         }
//       } catch {
//         if (mounted) {
//           setPreview('Encrypted message');
//         }
//       } finally {
//         if (mounted) setDecrypting(false);
//       }
//     };

//     loadPreview();

//     return () => {
//       mounted = false;
//     };
//   }, [chat.lastMessage]);

//   if (!otherUser) return null;

//   return (
//     <TouchableOpacity
//       style={styles.row}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       <Image
//         source={{
//           uri:
//             otherUser.profilePicture ||
//             'https://via.placeholder.com/50',
//         }}
//         style={styles.avatar}
//       />

//       <View style={styles.textContainer}>
//         <Text style={styles.username} numberOfLines={1}>
//           {otherUser.username}
//         </Text>

//         <Text style={styles.subtitle} numberOfLines={1}>
//           {decrypting ? 'Decrypting…' : preview}
//         </Text>
//       </View>

//       {chat.unreadCount > 0 && (
//         <View style={styles.unreadBadge}>
//           <Text style={styles.unreadText}>
//             {chat.unreadCount}
//           </Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// };

// const ChatListScreen = ({ navigation }) => {
//   const dispatch = useDispatch();
//   const { chats, loading } = useSelector(state => state.chat);
//   const { user } = useSelector(state => state.auth);

//   useFocusEffect(
//     useCallback(() => {
//       dispatch(fetchChats());
//     }, [dispatch])
//   );

//   const handleRefresh = () => {
//     dispatch(fetchChats());
//   };

//   const handlePressChat = async (otherUser) => {
//     try {
//       const res = await api.get(`/chats/with/${otherUser._id}`);
//       const chat = res.data?.data;

//       if (!chat?._id) return;

//       navigation.navigate(ROUTES.CHAT_DETAIL, {
//         chatId: chat._id,
//         username: otherUser.username,
//         receiverId: otherUser._id,
//       });
//     } catch (err) {
//       console.error('Open chat error:', err.message);
//     }
//   };

//   const renderItem = ({ item }) => {
//     if (!item?.participants || !user?._id) return null;

//     const otherUser = item.participants.find(
//       p => p._id !== user._id
//     );

//     return (
//       <ChatListItemRow
//         chat={item}
//         currentUser={user}
//         onPress={() => handlePressChat(otherUser)}
//       />
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Messages</Text>

//         <TouchableOpacity
//           onPress={() => navigation.navigate(ROUTES.NEW_CHAT)}
//         >
//           <Ionicons
//             name="create-outline"
//             size={28}
//             color={colors.textPrimary}
//           />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={chats}
//         renderItem={renderItem}
//         keyExtractor={item => item._id}
//         refreshing={loading}
//         onRefresh={handleRefresh}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={
//           !loading && chats.length === 0 ? styles.emptyList : null
//         }
//         ListEmptyComponent={
//           !loading && (
//             <View style={styles.emptyContainer}>
//               <Ionicons
//                 name="chatbubbles-outline"
//                 size={60}
//                 color={colors.border}
//               />
//               <Text style={styles.emptyText}>No messages yet</Text>
//               <Text style={styles.emptySubText}>
//                 Start a conversation with a friend!
//               </Text>
//             </View>
//           )
//         }
//       />
//     </SafeAreaView>
//   );
// };

// export default ChatListScreen;

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     marginRight: 12,
//     backgroundColor: '#eee',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   username: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textPrimary,
//   },
//   subtitle: {
//     fontSize: 13,
//     color: colors.textSecondary,
//     marginTop: 2,
//   },
//   unreadBadge: {
//     minWidth: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: colors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 6,
//   },
//   unreadText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   emptyList: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginTop: 15,
//   },
//   emptySubText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 5,
//   },
// });



// import api from '../../services/api';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import React, { useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import { useFocusEffect } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';

// import { fetchChats } from '../../redux/slices/chatSlice';
// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// const ChatListScreen = ({ navigation }) => {
//   const dispatch = useDispatch();

//   const { chats, loading } = useSelector(state => state.chat);
//   const { user } = useSelector(state => state.auth);

//   /* =========================
//      Fetch chats on focus
//   ========================== */
//   useFocusEffect(
//     useCallback(() => {
//       dispatch(fetchChats());
//     }, [dispatch])
//   );

//   /* =========================
//      Pull to refresh
//   ========================== */
//   const handleRefresh = () => {
//     dispatch(fetchChats());
//   };

//   /* =========================
//      Open chat
//   ========================== */
//   const handlePressChat = async (otherUser) => {
//     if (!otherUser?._id || !user?._id) return;

//     try {
//       const res = await api.get(`/chats/with/${otherUser._id}`);
//       const chat = res.data?.data;

//       if (!chat?._id) return;

//       navigation.navigate(ROUTES.CHAT_DETAIL, {
//         chatId: chat._id,
//         username: otherUser.username,
//         receiverId: otherUser._id,
//       });
//     } catch (err) {
//       console.error('❌ Open chat error:', err.message);
//     }
//   };

//   /* =========================
//      Render chat row
//   ========================== */
//   const renderItem = ({ item }) => {
//     if (!item?.participants || !user?._id) return null;

//     const otherUser = item.participants.find(
//       p => p._id !== user._id
//     );

//     if (!otherUser) return null;

//     /* =========================
//        🔑 INBOX STATUS LOGIC
//     ========================== */
//     let subtitleText = 'Start chat';

//     if (item.lastMessage) {
//       const senderId =
//         typeof item.lastMessage.sender === 'string'
//           ? item.lastMessage.sender
//           : item.lastMessage.sender?._id;

//       if (senderId === user._id) {
//         subtitleText = 'Sent';
//       } else {
//         subtitleText = 'Received';
//       }
//     }

//     return (
//       <TouchableOpacity
//         style={styles.row}
//         onPress={() => handlePressChat(otherUser)}
//         activeOpacity={0.7}
//       >
//         {/* AVATAR */}
//         <Image
//           source={{
//             uri:
//               otherUser.profilePicture ||
//               'https://via.placeholder.com/50',
//           }}
//           style={styles.avatar}
//         />

//         {/* TEXT */}
//         <View style={styles.textContainer}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser.username}
//           </Text>

//           <Text style={styles.subtitle} numberOfLines={1}>
//             {subtitleText}
//           </Text>
//         </View>

//         {/* UNREAD COUNT */}
//         {item.unreadCount > 0 && (
//           <View style={styles.unreadBadge}>
//             <Text style={styles.unreadText}>
//               {item.unreadCount}
//             </Text>
//           </View>
//         )}
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Messages</Text>

//         <TouchableOpacity
//           style={styles.newChatBtn}
//           onPress={() => navigation.navigate(ROUTES.NEW_CHAT)}
//         >
//           <Ionicons
//             name="create-outline"
//             size={28}
//             color={colors.textPrimary}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* CHAT LIST */}
//       <FlatList
//         data={chats}
//         renderItem={renderItem}
//         keyExtractor={item => item._id}
//         refreshing={loading}
//         onRefresh={handleRefresh}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={
//           !loading && chats.length === 0 ? styles.emptyList : null
//         }
//         ListEmptyComponent={
//           !loading && (
//             <View style={styles.emptyContainer}>
//               <Ionicons
//                 name="chatbubbles-outline"
//                 size={60}
//                 color={colors.border}
//               />
//               <Text style={styles.emptyText}>No messages yet</Text>
//               <Text style={styles.emptySubText}>
//                 Start a conversation with a friend!
//               </Text>
//             </View>
//           )
//         }
//       />
//     </SafeAreaView>
//   );
// };

// export default ChatListScreen;

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },

//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },

//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//   },

//   newChatBtn: {
//     padding: 5,
//   },

//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },

//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#eee',
//     marginRight: 12,
//   },

//   textContainer: {
//     flex: 1,
//   },

//   username: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textPrimary,
//   },

//   subtitle: {
//     fontSize: 13,
//     color: colors.textSecondary,
//     marginTop: 2,
//   },

//   unreadBadge: {
//     minWidth: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: colors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 6,
//   },

//   unreadText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },

//   emptyList: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },

//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },

//   emptyText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: colors.textPrimary,
//     marginTop: 15,
//   },

//   emptySubText: {
//     fontSize: 14,
//     color: colors.textSecondary,
//     marginTop: 5,
//   },
// });







import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import { fetchChats } from '../../redux/slices/chatSlice';
import ChatListItem from '../../components/molecules/ChatListItem';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const ChatListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { chats, loading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  /* =========================
     FETCH CHATS
  ========================= */
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchChats());
    }, [dispatch])
  );

  /* =========================
     OPEN CHAT
  ========================= */
  const handleOpenChat = async (otherUser) => {
    const res = await api.get(`/chats/with/${otherUser._id}`);
    const chat = res.data?.data;

    navigation.navigate(ROUTES.CHAT_DETAIL, {
      chatId: chat._id,
      username: otherUser.username,
      receiverId: otherUser._id,
    });
  };

  const renderItem = ({ item }) => {
    const otherUser = item.participants.find(
      p => p._id !== user._id
    );

    if (!otherUser) return null;

    return (
      <ChatListItem
        chat={item}
        otherUser={otherUser}
        currentUserId={user._id}
        onPress={() => handleOpenChat(otherUser)}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.username}>{user?.username}</Text>

        <TouchableOpacity>
          <Ionicons name="create-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* CHAT LIST */}
      <FlatList
        data={chats}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={() => dispatch(fetchChats())}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default ChatListScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  container: {
  flex: 1,
  backgroundColor: '#000',
},

});
