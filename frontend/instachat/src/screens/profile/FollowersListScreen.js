import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const FollowersListScreen = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const { user: authUser } = useSelector(state => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchFollowers = async () => {
      try {
        const res = await api.get(`/users/${userId}/followers`);
        const list = res.data.data || [];

        // ✅ safer check even if following undefined
        const followingIds = authUser?.following?.map(f => f._id || f) || [];

        const formatted = list.map(u => ({
          ...u,
          isFollowing: followingIds.includes(u._id),
        }));

        setUsers(formatted);
      } catch (err) {
        console.error('Followers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, authUser]);

  const handleFollowToggle = async (targetUserId) => {
    setUsers(prev =>
      prev.map(u =>
        u._id === targetUserId
          ? { ...u, isFollowing: !u.isFollowing }
          : u
      )
    );

    try {
      await api.post(`/users/follow/${targetUserId}`);
    } catch (err) {
      // rollback if failed
      setUsers(prev =>
        prev.map(u =>
          u._id === targetUserId
            ? { ...u, isFollowing: !u.isFollowing }
            : u
        )
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.left}
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
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>

            {item._id !== authUser?._id && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  item.isFollowing && styles.followingBtn,
                ]}
                onPress={() => handleFollowToggle(item._id)}
              >
                <Text style={styles.followText}>
                  {item.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#888' }}>No followers yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default FollowersListScreen;

/* =====================
   STYLES (same as before)
===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  username: { color: 'white', fontSize: 16 },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
  },
  followingBtn: {
    backgroundColor: '#262626',
  },
  followText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
