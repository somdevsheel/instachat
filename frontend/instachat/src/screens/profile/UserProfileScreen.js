import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';
import usePullToRefresh from '../../hooks/usePullToRefresh';

const UserProfileScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const { user: authUser } = useSelector(state => state.auth);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  /* =========================
     FETCH PROFILE
  ========================= */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get(`/users/profile/${username}`);
      const data = res.data.data;

      setProfileUser(data);
      setIsFollowing(data.isFollowing === true);
      setCanMessage(data.canMessage === true || data.isFollowing === true);
      setFollowersCount(data.followersCount || 0);
    } catch (err) {
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // ✅ Pull to refresh hook
  const { refreshing, onRefresh } = usePullToRefresh(fetchProfile);

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  /* =========================
     FOLLOW / UNFOLLOW
  ========================= */
  const handleFollowToggle = async () => {
    if (!profileUser?._id) return;

    const wasFollowing = isFollowing;

    try {
      // Optimistic update
      setIsFollowing(!wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
      
      // ✅ If now following, enable message button immediately
      if (!wasFollowing) {
        setCanMessage(true);
      }

      const res = await api.post(`/users/follow/${profileUser._id}`);
      
      // Update with actual server response if available
      if (res.data.followersCount !== undefined) {
        setFollowersCount(res.data.followersCount);
      }
    } catch (err) {
      console.error('Follow error:', err);
      // Rollback on error
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
      if (!wasFollowing) {
        setCanMessage(false);
      }
    }
  };

  /* =========================
     MESSAGE
  ========================= */
  const handleMessagePress = async () => {
    if (!profileUser?._id) return;

    try {
      const res = await api.get(`/chats/with/${profileUser._id}`);
      const chat = res.data.data;

      if (!chat?._id) return;

      navigation.navigate(ROUTES.CHAT_DETAIL, {
        chatId: chat._id,
        username: profileUser.username,
        receiverId: profileUser._id,
        profilePicture: profileUser.profilePicture,
      });
    } catch (err) {
      console.error('Message error:', err);
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  if (!profileUser) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.headerUsername}>
            {profileUser.username}
          </Text>
          {profileUser.isVerified && (
            <MaterialCommunityIcons
              name="check-decagram"
              size={16}
              color="#0095F6"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>

        <Ionicons name="ellipsis-vertical" size={24} color="white" />
      </View>

      {/* ✅ ScrollView with RefreshControl */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#0095F6']}
          />
        }
      >
        {/* PROFILE */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                profileUser.profilePicture ||
                'https://via.placeholder.com/100',
            }}
            style={styles.avatar}
          />

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>

            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate(ROUTES.FOLLOW_LIST, {
                userId: profileUser._id,
                type: 'followers',
                username: profileUser.username,
              })}
            >
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate(ROUTES.FOLLOW_LIST, {
                userId: profileUser._id,
                type: 'following',
                username: profileUser.username,
              })}
            >
              <Text style={styles.statNumber}>
                {profileUser.followingCount}
              </Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BIO */}
        <View style={styles.bioContainer}>
          <Text style={styles.nameText}>
            {profileUser.name || profileUser.username}
          </Text>
          {profileUser.bio ? (
            <Text style={styles.bioText}>{profileUser.bio}</Text>
          ) : null}
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isFollowing ? styles.followingBtn : styles.followBtn,
            ]}
            onPress={handleFollowToggle}
          >
            <Text style={[
              styles.actionBtnText,
              isFollowing && styles.followingBtnText,
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>

          {/* ✅ Show Message button only when canMessage is true */}
          {canMessage ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.messageBtn]}
              onPress={handleMessagePress}
            >
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.disabledBtn]}
              disabled={true}
            >
              <Text style={styles.disabledBtnText}>Follow to message</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  headerUsername: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 13 },

  bioContainer: { paddingHorizontal: 15, marginTop: 12 },
  nameText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  bioText: { color: 'white', marginTop: 4, fontSize: 14 },

  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 15,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    backgroundColor: '#0095F6',
  },
  followingBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#363636',
  },
  messageBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#363636',
  },
  disabledBtn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  followingBtnText: {
    color: '#fff',
  },
  disabledBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
});