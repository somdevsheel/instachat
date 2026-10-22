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
  getFollowRequests,
  respondToFollowRequest,
} from '../../api/User.api';
import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';

const FollowRequestsScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getFollowRequests();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Load follow requests error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRespond = async (userId, action) => {
    setBusyId(userId);
    try {
      await respondToFollowRequest(userId, action);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Respond to follow request error:', err);
    } finally {
      setBusyId(null);
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
        <Text style={styles.title}>Follow requests</Text>
        <View style={styles.backBtn} />
      </View>

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
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.userInfo}
                activeOpacity={0.7}
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
                <View style={styles.rowText}>
                  <Text style={styles.username}>{item.username}</Text>
                  {!!item.name && <Text style={styles.name}>{item.name}</Text>}
                </View>
              </TouchableOpacity>

              {busyId === item._id ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.btn, styles.confirmBtn]}
                    onPress={() => handleRespond(item._id, 'accept')}
                  >
                    <Text style={styles.btnText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.deleteBtn]}
                    onPress={() => handleRespond(item._id, 'decline')}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="person-add-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyText}>No pending follow requests</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default FollowRequestsScreen;

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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  confirmBtn: { backgroundColor: colors.accent },
  deleteBtn: { backgroundColor: colors.surfaceRaised },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
