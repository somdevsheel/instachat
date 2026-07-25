import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { searchUsers, followUser } from '../../api/User.api';
import { getTrending } from '../../api/Posts.api';
import { ROUTES } from '../../navigation/routes.constants';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import colors, { gradients } from '../../theme/colors';

const TOPIC_GRADIENTS = [
  ['#1A2A4A', '#0A3A5A'],
  ['#3A1A1A', '#5A2A0A'],
  ['#1A3A1A', '#2A5A1A'],
  ['#3A1A3A', '#5A0A4A'],
  ['#4A2A0A', '#6A3A0A'],
  ['#0A2A2A', '#103A3A'],
];

const SearchScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const authUserId = useSelector(state => state.auth.user?._id);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);

  const debounceRef = useRef(null);

  /* =========================
     TRENDING TOPICS
  ========================= */
  useEffect(() => {
    getTrending()
      .then(res => setTrending(Array.isArray(res?.data) ? res.data : []))
      .catch(() => {});
  }, []);

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

  const handleTopicPress = (tag) => {
    setQuery(tag);
    performSearch(tag);
  };

  /* =========================
     PULL TO REFRESH
  ========================= */
  const handleRefresh = useCallback(async () => {
    if (query.trim()) {
      await performSearch(query);
    } else {
      getTrending()
        .then(res => setTrending(Array.isArray(res?.data) ? res.data : []))
        .catch(() => {});
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

  const showTrending = !query.trim() && trending.length > 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
      edges={['top', 'bottom']}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Discover</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            placeholder="Search people, tags, places..."
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.accent}
            style={{ marginVertical: 10 }}
          />
        )}

        {showTrending ? (
          <FlatList
            data={trending}
            keyExtractor={item => item.tag}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10, paddingBottom: insets.bottom + 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Trending Topics</Text>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.topicCard}
                onPress={() => handleTopicPress(item.tag)}
              >
                <LinearGradient
                  colors={TOPIC_GRADIENTS[index % TOPIC_GRADIENTS.length]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTag}>#{item.tag}</Text>
                  <Text style={styles.topicCount}>{item.postsCount} posts</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={users}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
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
        )}
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
    backgroundColor: colors.bg,
  },

  inner: {
    flex: 1,
    padding: 12,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 14,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },

  topicCard: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },

  topicInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
  },

  topicTag: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  topicCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 1,
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
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },

  followBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  followingBtn: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },

  followText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },

  emptyText: {
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 30,
  },
});
