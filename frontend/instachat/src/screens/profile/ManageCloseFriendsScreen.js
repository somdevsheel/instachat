import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getCloseFriendsCandidates,
  toggleCloseFriend,
} from '../../api/User.api';
import colors from '../../theme/colors';

const ManageCloseFriendsScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getCloseFriendsCandidates();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Load close friends error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, isCloseFriend: !u.isCloseFriend } : u
      )
    );

    try {
      await toggleCloseFriend(userId);
    } catch (err) {
      console.error('Toggle close friend error:', err);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isCloseFriend: !u.isCloseFriend } : u
        )
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Close Friends</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>
        Choose who sees your Close Friends posts and shows up in your
        Close Friends feed tab.
      </Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            users.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handleToggle(item._id)}
            >
              <Image
                source={{
                  uri: item.profilePicture || 'https://via.placeholder.com/50',
                }}
                style={styles.avatar}
              />
              <View style={styles.rowText}>
                <Text style={styles.username}>{item.username}</Text>
                {!!item.name && <Text style={styles.name}>{item.name}</Text>}
              </View>
              <Ionicons
                name={item.isCloseFriend ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={item.isCloseFriend ? colors.success : colors.textFaint}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyText}>
                Follow people to add them as close friends
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ManageCloseFriendsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 50,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceRaised,
  },
  rowText: { flex: 1 },
  username: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  name: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
});
