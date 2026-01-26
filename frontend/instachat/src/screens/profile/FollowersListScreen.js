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

  // ✅ Check if viewing own profile
  const isOwnProfile = userId === authUser?._id;

  useEffect(() => {
    if (!userId) return;

    const fetchFollowers = async () => {
      try {
        const res = await api.get(`/users/${userId}/followers`);
        const list = res.data.data || [];

        // ✅ If viewing own profile, backend already provides correct isFollowing
        // ✅ If viewing other's profile, we need to check against our following list
        if (!isOwnProfile) {
          const followingIds = authUser?.following?.map(f => f._id || f) || [];
          
          const formatted = list.map(u => ({
            ...u,
            isFollowing: followingIds.includes(u._id),
          }));

          setUsers(formatted);
        } else {
          // For own profile, use backend's isFollowing status
          setUsers(list);
        }
      } catch (err) {
        console.error('Followers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, authUser, isOwnProfile]);

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
      console.error('Follow toggle error:', err);
      // Rollback on error
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

            {/* ✅ Don't show button for own profile */}
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
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No followers yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default FollowersListScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  left: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  username: { 
    color: 'white', 
    fontSize: 16 
  },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
  },
  followingBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#363636',
  },
  followText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});