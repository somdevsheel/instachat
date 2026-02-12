import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { searchUsers, followUser } from '../../api/User.api';
import { ROUTES } from '../../navigation/routes.constants';
import usePullToRefresh from '../../hooks/usePullToRefresh';

const SearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const authUserId = useSelector(state => state.auth.user?._id);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  /* =========================
     SEARCH (DEBOUNCED)
  ========================= */
  const performSearch = useCallback(async (searchText) => {
    if (!searchText?.trim()) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const res = await searchUsers(searchText.trim());
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (text) => {
    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!text.trim()) {
      setUsers([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(text);
    }, 400);
  };

  /* =========================
     PULL TO REFRESH
  ========================= */
  const handleRefresh = useCallback(async () => {
    if (query.trim()) {
      await performSearch(query);
    }
  }, [query, performSearch]);

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);

  /* =========================
     FOLLOW / UNFOLLOW
  ========================= */
  const handleFollowToggle = async (userId) => {
    const previousUsers = users;

    try {
      // ✅ Optimistic update
      setUsers(prev =>
        prev.map(u =>
          u._id === userId
            ? { ...u, isFollowing: !u.isFollowing }
            : u
        )
      );

      await followUser(userId);
    } catch (err) {
      console.error('Follow failed:', err);
      setUsers(previousUsers); // rollback
    }
  };

  /* =========================
     RENDER USER ROW
  ========================= */
  const renderItem = ({ item }) => {
    const isFollowing = item.isFollowing === true;

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() =>
            navigation.navigate(ROUTES.USER_PROFILE, {
              username: item.username,
            })
          }
        >
          <Image
            source={{
              uri:
                item.profilePicture ||
                'https://via.placeholder.com/50',
            }}
            style={styles.avatar}
          />

          <Text style={styles.username}>
            {item.username}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.followBtn,
            isFollowing && styles.followingBtn,
          ]}
          onPress={() => handleFollowToggle(item._id)}
        >
          <Text style={styles.followText}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
      edges={['top', 'bottom']}
    >
      <View style={styles.inner}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading && (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ marginVertical: 10 }}
          />
        )}

        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#0095F6']}
            />
          }
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
          ListEmptyComponent={
            !loading && query.trim() ? (
              <Text style={styles.emptyText}>
                No users found
              </Text>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },

  inner: {
    flex: 1,
    padding: 12,
  },

  input: {
    backgroundColor: '#262626',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },

  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  followingBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333',
  },

  followText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 30,
  },
});