import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES } from '../../navigation/routes.constants';
import { loadUser } from '../../redux/slices/authSlice';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import colors, { gradients } from '../../theme/colors';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 4) / 3;

const ProfileScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('posts');
  const touchStartX = useRef(0);

  const { refreshing, onRefresh } = usePullToRefresh(() => {
    dispatch(loadUser());
  });

  /* =========================
     ✅ CRITICAL FIX:
     USE CACHED IMAGE FIRST
  ========================= */
  const profileImageUri = useMemo(() => {
    if (user?.profilePictureCached) {
      // ✅ Local cached image (FAST, OFFLINE)
      return user.profilePictureCached;
    }

    if (user?.profilePicture) {
      // ✅ CDN / AWS image
      return user.profilePicture;
    }

    // Fallback
    return 'https://via.placeholder.com/100';
  }, [user?.profilePictureCached, user?.profilePicture]);

  const handleSwipeLeft = useCallback(() => {
    if (activeTab === 'posts') setActiveTab('reels');
    else if (activeTab === 'reels') setActiveTab('tagged');
  }, [activeTab]);

  const handleSwipeRight = useCallback(() => {
    if (activeTab === 'tagged') setActiveTab('reels');
    else if (activeTab === 'reels') setActiveTab('posts');
  }, [activeTab]);

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerUsername}>{user.username}</Text>
          <Ionicons name="chevron-down" size={18} color="#fff" />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate(ROUTES.CREATE_POST)}
          >
            <Ionicons name="add-outline" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate(ROUTES.PROFILE_SETTINGS)}
          >
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* PROFILE SECTION */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={gradients.storyRing} style={styles.storyRing}>
              <View style={styles.storyRingInner}>
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.avatar}
                />
              </View>
            </LinearGradient>

            <TouchableOpacity
              style={styles.avatarBadge}
              onPress={() => navigation.navigate(ROUTES.CREATE_STORY)}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.postsCount ?? 0}
              </Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>

            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate('FOLLOWERS_LIST', {
                  userId: user._id,
                })
              }
            >
              <Text style={styles.statNumber}>
                {user.followersCount ?? 0}
              </Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                navigation.navigate('FOLLOWING_LIST', {
                  userId: user._id,
                })
              }
            >
              <Text style={styles.statNumber}>
                {user.followingCount ?? 0}
              </Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BIO */}
        <View style={styles.bioSection}>
          {user.name && (
            <Text style={styles.displayName}>{user.name}</Text>
          )}
          <Text style={styles.bioText}>
            {user.bio || 'No bio yet'}
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
          >
            <Text style={styles.primaryButtonText}>Edit profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Share profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-add-outline" size={16} color={colors.textPrimary} />
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
              size={24}
              color={activeTab === 'posts' ? colors.accent : colors.textFaint}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons
              name="videocam-outline"
              size={24}
              color={activeTab === 'reels' ? colors.accent : colors.textFaint}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={activeTab === 'tagged' ? colors.accent : colors.textFaint}
            />
          </TouchableOpacity>
        </View>

        {/* GRID */}
        <View
          onTouchStart={e => (touchStartX.current = e.nativeEvent.pageX)}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.nativeEvent.pageX;
            if (Math.abs(diff) > 50) {
              diff > 0 ? handleSwipeLeft() : handleSwipeRight();
            }
          }}
        >
          {user.posts?.length > 0 ? (
            <FlatList
              data={user.posts}
              renderItem={renderGridItem}
              keyExtractor={item => item._id}
              numColumns={3}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={60} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>No content yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  lockContainer: { width: 28 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerUsername: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row' },
  headerIcon: { marginLeft: 8 },
  profileSection: { flexDirection: 'row', padding: 16 },
  avatarContainer: { marginRight: 28 },
  storyRing: { width: 90, height: 90, borderRadius: 45, padding: 2.5, justifyContent: 'center', alignItems: 'center' },
  storyRingInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 78, height: 78, borderRadius: 39 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 13 },
  bioSection: { paddingHorizontal: 16 },
  displayName: { color: colors.textPrimary, fontWeight: '600' },
  bioText: { color: colors.textPrimary },
  actionsRow: { flexDirection: 'row', padding: 16 },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  primaryButtonText: { color: colors.textPrimary, fontWeight: '600' },
  iconButton: {
    width: 34,
    height: 34,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  gridItem: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  gridItemMargin: { marginRight: 2 },
  gridImage: { width: '100%', height: '100%' },
  videoIndicator: { position: 'absolute', top: 8, right: 8 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyTitle: { color: colors.textSecondary, marginTop: 12 },
});
