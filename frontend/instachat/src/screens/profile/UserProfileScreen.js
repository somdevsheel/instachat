import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const UserProfileScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const { user: authUser } = useSelector(state => state.auth);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canMessage, setCanMessage] = useState(false);

  /* =========================
     FETCH PROFILE
  ========================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${username}`);
        const data = res.data.data;

        setProfileUser(data);
        setIsFollowing(data.isFollowing);
        setCanMessage(data.canMessage);
      } catch (err) {
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  /* =========================
     FOLLOW / UNFOLLOW
  ========================= */
  const handleFollowToggle = async () => {
    try {
      setIsFollowing(prev => !prev);
      await api.post(`/users/follow/${profileUser._id}`);

      if (!isFollowing) {
        setCanMessage(true);
      }
    } catch (err) {
      console.error('Follow error:', err);
      setIsFollowing(prev => !prev);
    }
  };

  /* =========================
     MESSAGE (🔐 E2EE SAFE)
  ========================= */
  const handleMessagePress = async () => {
    if (!canMessage || !profileUser?._id) return;

    try {
      // 1️⃣ Get or create chat
      const res = await api.get(`/chats/with/${profileUser._id}`);
      const chat = res.data.data;

      if (!chat?._id) return;

      // 2️⃣ Navigate WITH REQUIRED CRYPTO PARAMS
      navigation.navigate(ROUTES.CHAT_DETAIL, {
        chatId: chat._id,
        username: profileUser.username,
        receiverId: profileUser._id, // 🔐 REQUIRED FOR encryptMessage()
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

      <ScrollView>
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

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profileUser.followersCount}
              </Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profileUser.followingCount}
              </Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>
        </View>

        {/* BIO */}
        <View style={styles.bioContainer}>
          <Text style={styles.nameText}>
            {profileUser.name || profileUser.username}
          </Text>
          <Text style={styles.bioText}>
            {profileUser.bio || 'No bio yet'}
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing && styles.followingBtn,
            ]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.followBtnText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.messageBtn,
              !canMessage && styles.disabledBtn,
            ]}
            onPress={handleMessagePress}
            disabled={!canMessage}
          >
            <Text style={styles.btnText}>
              {canMessage ? 'Message' : 'Follow to message'}
            </Text>
          </TouchableOpacity>
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
    padding: 15,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  headerUsername: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 10,
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
  },
  statItem: { alignItems: 'center' },
  statNumber: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: 'white', fontSize: 13 },

  bioContainer: { paddingHorizontal: 15, marginTop: 10 },
  nameText: { color: 'white', fontWeight: 'bold' },
  bioText: { color: 'white', marginTop: 2 },

  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 15,
  },
  followBtn: {
    flex: 1,
    backgroundColor: '#0095F6',
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  followingBtn: { backgroundColor: '#262626' },
  messageBtn: {
    flex: 1,
    backgroundColor: '#262626',
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  followBtnText: { color: 'white', fontWeight: 'bold' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
