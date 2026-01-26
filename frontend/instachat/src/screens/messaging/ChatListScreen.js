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
