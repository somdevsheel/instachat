// import React, { useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useDispatch, useSelector } from 'react-redux';
// import { useFocusEffect } from '@react-navigation/native';

// import { fetchChats } from '../../redux/slices/chatSlice';
// import ChatListItem from '../../components/molecules/ChatListItem';
// import api from '../../services/api';
// import { ROUTES } from '../../navigation/routes.constants';

// const ChatListScreen = ({ navigation }) => {
//   const dispatch = useDispatch();
//   const { chats, loading } = useSelector(state => state.chat);
//   const { user } = useSelector(state => state.auth);

//   /* =========================
//      FETCH CHATS
//   ========================= */
//   useFocusEffect(
//     useCallback(() => {
//       dispatch(fetchChats());
//     }, [dispatch])
//   );

//   /* =========================
//      OPEN CHAT
//   ========================= */
//   const handleOpenChat = async (otherUser) => {
//     const res = await api.get(`/chats/with/${otherUser._id}`);
//     const chat = res.data?.data;

//     navigation.navigate(ROUTES.CHAT_DETAIL, {
//       chatId: chat._id,
//       username: otherUser.username,
//       receiverId: otherUser._id,
//     });
//   };

//   const renderItem = ({ item }) => {
//     const otherUser = item.participants.find(
//       p => p._id !== user._id
//     );

//     if (!otherUser) return null;

//     return (
//       <ChatListItem
//         chat={item}
//         otherUser={otherUser}
//         currentUserId={user._id}
//         onPress={() => handleOpenChat(otherUser)}
//       />
//     );
//   };

//   return (
//     <SafeAreaView edges={['top']} style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Text style={styles.username}>{user?.username}</Text>

//         <TouchableOpacity>
//           <Ionicons name="create-outline" size={26} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* CHAT LIST */}
//       <FlatList
//         data={chats}
//         keyExtractor={item => item._id}
//         renderItem={renderItem}
//         refreshing={loading}
//         onRefresh={() => dispatch(fetchChats())}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 20 }}
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
//     backgroundColor: '#000',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   username: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '700',
//   },
//   container: {
//   flex: 1,
//   backgroundColor: '#000',
// },

// });





import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import {
  fetchChats,
  fetchUnreadCount,
  setUnreadCount,
} from '../../redux/slices/chatSlice';
import ChatListItem from '../../components/molecules/ChatListItem';
import api from '../../services/api';
import { markAllAsRead } from '../../api/Chat.api';
import { ROUTES } from '../../navigation/routes.constants';

const ChatListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { chats, loading, unreadCount } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);
  
  const [markingRead, setMarkingRead] = useState(false);

  /* =========================
     FETCH CHATS & UNREAD COUNT
  ========================= */
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchChats());
      dispatch(fetchUnreadCount());
    }, [dispatch])
  );

  /* =========================
     MARK ALL AS READ
  ========================= */
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert('No Unread Messages', 'You have no unread messages.');
      return;
    }

    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} messages as read?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Read',
          onPress: async () => {
            setMarkingRead(true);
            try {
              await markAllAsRead();
              dispatch(setUnreadCount(0));
              dispatch(fetchChats()); // Refresh chat list
              Alert.alert('Success', 'All messages marked as read');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark messages as read');
            } finally {
              setMarkingRead(false);
            }
          },
        },
      ]
    );
  };

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

        <View style={styles.headerRight}>
          {/* MARK ALL AS READ BUTTON */}
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              disabled={markingRead}
              style={styles.markReadButton}
            >
              {markingRead ? (
                <ActivityIndicator size="small" color="#0095f6" />
              ) : (
                <Ionicons
                  name="checkmark-done"
                  size={24}
                  color="#0095f6"
                />
              )}
            </TouchableOpacity>
          )}

          {/* NEW CHAT BUTTON */}
          <TouchableOpacity>
            <Ionicons name="create-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT LIST */}
      <FlatList
        data={chats}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={() => {
          dispatch(fetchChats());
          dispatch(fetchUnreadCount());
        }}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markReadButton: {
    padding: 4,
  },
});