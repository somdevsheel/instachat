import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const NewChatScreen = () => {
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);   // full mutual list
  const [users, setUsers] = useState([]);         // filtered list
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD MUTUAL FOLLOWERS
  ========================= */
  useEffect(() => {
    const loadMutualUsers = async () => {
      try {
        const res = await api.get('/api/v1/users/mutual');
        const data = res.data?.data || [];
        setAllUsers(data);
        setUsers(data);
      } catch (err) {
        console.log('Mutual users load error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMutualUsers();
  }, []);

  /* =========================
     LOCAL SEARCH (NO API)
  ========================= */
  const handleSearch = text => {
    setQuery(text);

    if (!text.trim()) {
      setUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user =>
      user.username.toLowerCase().includes(text.toLowerCase())
    );

    setUsers(filtered);
  };

  /* =========================
     OPEN / CREATE CHAT
  ========================= */
  const handleSelectUser = async user => {
    try {
      const res = await api.get(`/api/v1/chats/with/${user._id}`);
      const chat = res.data.data;

      navigation.replace('ChatDetailScreen', {
        chatId: chat._id,
        username: user.username,
        receiverId: user._id, // 🔐 E2EE-ready
      });
    } catch (err) {
      console.log('Create chat error:', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => handleSelectUser(item)}
    >
      <Text style={styles.username}>{item.username}</Text>
    </TouchableOpacity>
  );

  /* =========================
     UI
  ========================= */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search mutual followers"
        value={query}
        onChangeText={handleSearch}
        style={styles.input}
        autoFocus
      />

      {users.length === 0 ? (
        <Text style={styles.emptyText}>No mutual followers found</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

export default NewChatScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#585656',
    paddingHorizontal: 16,
  },
  input: {
    height: 44,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    fontSize: 16,
  },
  userRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  username: {
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#888',
  },
});
