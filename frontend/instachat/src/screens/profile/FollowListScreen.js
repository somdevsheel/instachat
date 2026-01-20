import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const FollowListScreen = ({ route, navigation }) => {
  const { userId, type } = route.params; // type = followers | following
  const { user: authUser } = useSelector(state => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await api.get(
          `/users/${type}/${userId}`
        );
        setUsers(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [userId, type]);

  const followingIds = Array.isArray(authUser?.following)
    ? authUser.following.map(id => id.toString())
    : [];

  const renderItem = ({ item }) => {
    const isFollowing = followingIds.includes(item._id);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigation.navigate(ROUTES.USER_PROFILE, {
            username: item.username,
          })
        }
      >
        <Image
          source={{
            uri: item.profilePicture || 'https://via.placeholder.com/50',
          }}
          style={styles.avatar}
        />

        <Text style={styles.username}>{item.username}</Text>

        {authUser._id !== item._id && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing && styles.followingBtn,
            ]}
          >
            <Text style={styles.followText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={item => item._id}
      renderItem={renderItem}
      style={{ backgroundColor: 'black' }}
    />
  );
};

export default FollowListScreen;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  username: { color: 'white', flex: 1 },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followingBtn: { backgroundColor: '#262626' },
  followText: { color: 'white', fontWeight: '600' },
});
