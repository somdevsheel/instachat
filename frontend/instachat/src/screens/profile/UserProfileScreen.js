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
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';
import usePullToRefresh from '../../hooks/usePullToRefresh';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 4) / 3;

const UserProfileScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const { user: authUser } = useSelector(state => state.auth);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');

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
     RENDER GRID ITEM
  ========================= */
  const renderGridItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        index % 3 !== 2 && styles.gridItemMargin,
      ]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate(ROUTES.POST_DETAIL, { postId: item._id })}
    >
      <Image
        source={{ uri: item.media?.variants?.original }}
        style={styles.gridImage}
      />
      {item.media?.type === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
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
        </View>

        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* ✅ ScrollView with RefreshControl */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#0095F6']}
          />
        }
      >
        {/* PROFILE SECTION */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.storyRing}>
              <Image
                source={{
                  uri:
                    profileUser.profilePicture ||
                    'https://via.placeholder.com/100',
                }}
                style={styles.avatar}
              />
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profileUser.postsCount || 0}
              </Text>
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
                {profileUser.followingCount || 0}
              </Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BIO */}
        <View style={styles.bioSection}>
          {profileUser.name && (
            <Text style={styles.displayName}>{profileUser.name}</Text>
          )}
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
              style={[styles.actionBtn, styles.messageBtn]}
              disabled={true}
            >
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid-outline"
              size={26}
              color={activeTab === 'posts' ? '#fff' : '#8e8e8e'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons
              name="videocam-outline"
              size={26}
              color={activeTab === 'reels' ? '#fff' : '#8e8e8e'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons
              name="person-outline"
              size={26}
              color={activeTab === 'tagged' ? '#fff' : '#8e8e8e'}
            />
          </TouchableOpacity>
        </View>

        {/* POST GRID */}
        <View style={styles.gridContainer}>
          {profileUser.posts?.length > 0 ? (
            <FlatList
              data={profileUser.posts}
              renderItem={renderGridItem}
              keyExtractor={item => item._id}
              numColumns={3}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={60} color="#262626" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
            </View>
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
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  headerUsername: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
  },

  /* PROFILE SECTION */
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 28,
  },
  storyRing: {
    borderWidth: 2,
    borderColor: '#262626',
    borderRadius: 50,
    padding: 2,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { 
    alignItems: 'center',
  },
  statNumber: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700',
  },
  statLabel: { 
    color: '#fff', 
    fontSize: 13,
  },

  /* BIO */
  bioSection: { 
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  displayName: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  bioText: { 
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
  },

  /* ACTIONS */
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    height: 32,
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
  iconButton: {
    width: 32,
    height: 32,
    backgroundColor: '#262626',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#363636',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  followingBtnText: {
    color: '#fff',
  },

  /* TABS */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
    marginTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },

  /* GRID */
  gridContainer: {
    marginTop: 0,
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: '#1a1a1a',
  },
  gridItemMargin: {
    marginRight: 2,
    marginBottom: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
  },
});