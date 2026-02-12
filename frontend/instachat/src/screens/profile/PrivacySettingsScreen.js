// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const PrivacySettingsScreen = () => {
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.header}>Privacy</Text>

//       <Text style={styles.item}>Private account</Text>
//       <Text style={styles.item}>Blocked accounts</Text>
//       <Text style={styles.item}>Muted accounts</Text>
//       <Text style={styles.item}>Story controls</Text>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff', padding: 20 },
//   header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   item: {
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     fontSize: 16,
//   },
// });

// export default PrivacySettingsScreen;







import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getPrivacySettings,
  updatePrivacySettings,
  getBlockedUsers,
  blockUser,
  getMutedUsers,
  muteUser,
} from '../../api/User.api';

/* =========================
   TOGGLE ROW
========================= */

const ToggleRow = ({ icon, label, description, value, onToggle, disabled }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleLeft}>
      {icon && (
        <Ionicons
          name={icon}
          size={22}
          color="#fff"
          style={styles.rowIcon}
        />
      )}
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? (
          <Text style={styles.toggleDesc}>{description}</Text>
        ) : null}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: '#333', true: '#0095f6' }}
      thumbColor={value ? '#fff' : '#888'}
      ios_backgroundColor="#333"
    />
  </View>
);

/* =========================
   NAV ROW
========================= */

const NavRow = ({ icon, label, count, onPress }) => (
  <TouchableOpacity
    style={styles.navRow}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={styles.navRowLeft}>
      {icon && (
        <Ionicons
          name={icon}
          size={22}
          color="#fff"
          style={styles.rowIcon}
        />
      )}
      <Text style={styles.navRowLabel}>{label}</Text>
    </View>
    <View style={styles.navRowRight}>
      {count > 0 && <Text style={styles.navRowCount}>{count}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </View>
  </TouchableOpacity>
);

/* =========================
   USER LIST MODAL
========================= */

const UserListModal = ({
  visible,
  onClose,
  title,
  users,
  loading,
  onAction,
  actionLabel,
}) => {
  const renderUser = ({ item }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={20} color="#555" />
          </View>
        )}
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onAction(item._id)}
      >
        <Text style={styles.actionBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={48}
              color="#333"
            />
            <Text style={styles.emptyText}>
              No {title.toLowerCase()} yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

/* =========================
   MAIN SCREEN
========================= */

const PrivacySettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    isPrivate: false,
    activityStatusVisible: true,
    showReadReceipts: true,
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Blocked
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  // Muted
  const [mutedUsers, setMutedUsers] = useState([]);
  const [mutedLoading, setMutedLoading] = useState(false);
  const [showMuted, setShowMuted] = useState(false);

  /* =========================
     FETCH SETTINGS
  ========================= */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPrivacySettings();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Fetch privacy settings error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* =========================
     TOGGLE SETTING
  ========================= */
  const handleToggle = async (field) => {
    const newValue = !settings[field];

    // Optimistic update
    setSettings((prev) => ({ ...prev, [field]: newValue }));

    try {
      setUpdating(true);
      const res = await updatePrivacySettings({ [field]: newValue });

      if (!res.success) {
        // Revert on failure
        setSettings((prev) => ({ ...prev, [field]: !newValue }));
        Alert.alert('Error', 'Failed to update setting');
      }
    } catch (err) {
      setSettings((prev) => ({ ...prev, [field]: !newValue }));
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setUpdating(false);
    }
  };

  /* =========================
     BLOCKED USERS
  ========================= */
  const fetchBlocked = async () => {
    try {
      setBlockedLoading(true);
      const res = await getBlockedUsers();
      if (res.success) {
        setBlockedUsers(res.data);
      }
    } catch (err) {
      console.error('Fetch blocked error:', err);
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleOpenBlocked = () => {
    setShowBlocked(true);
    fetchBlocked();
  };

  const handleUnblock = async (userId) => {
    try {
      const res = await blockUser(userId);
      if (res.success && !res.blocked) {
        setBlockedUsers((prev) =>
          prev.filter((u) => u._id !== userId)
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  /* =========================
     MUTED USERS
  ========================= */
  const fetchMuted = async () => {
    try {
      setMutedLoading(true);
      const res = await getMutedUsers();
      if (res.success) {
        setMutedUsers(res.data);
      }
    } catch (err) {
      console.error('Fetch muted error:', err);
    } finally {
      setMutedLoading(false);
    }
  };

  const handleOpenMuted = () => {
    setShowMuted(true);
    fetchMuted();
  };

  const handleUnmute = async (userId) => {
    try {
      const res = await muteUser(userId);
      if (res.success && !res.muted) {
        setMutedUsers((prev) =>
          prev.filter((u) => u._id !== userId)
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to unmute user');
    }
  };

  /* =========================
     RENDER
  ========================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SECTION: Account Privacy */}
        <Text style={styles.sectionTitle}>Account Privacy</Text>

        <ToggleRow
          icon="lock-closed-outline"
          label="Private account"
          description="When your account is private, only people you approve can see your photos and videos."
          value={settings.isPrivate}
          onToggle={() => handleToggle('isPrivate')}
          disabled={updating}
        />

        {/* SECTION: Interactions */}
        <Text style={styles.sectionTitle}>Interactions</Text>

        <NavRow
          icon="ban-outline"
          label="Blocked accounts"
          count={blockedUsers.length}
          onPress={handleOpenBlocked}
        />
        <NavRow
          icon="volume-mute-outline"
          label="Muted accounts"
          count={mutedUsers.length}
          onPress={handleOpenMuted}
        />

        {/* SECTION: Activity */}
        <Text style={styles.sectionTitle}>Activity</Text>

        <ToggleRow
          icon="ellipse-outline"
          label="Activity status"
          description="Allow accounts you follow and anyone you message to see when you were last active or are currently active. When this is turned off, you won't be able to see the activity status of other accounts."
          value={settings.activityStatusVisible}
          onToggle={() => handleToggle('activityStatusVisible')}
          disabled={updating}
        />

        {/* SECTION: Messaging */}
        <Text style={styles.sectionTitle}>Messaging</Text>

        <ToggleRow
          icon="checkmark-done-outline"
          label="Read receipts"
          description="When this is turned off, you won't be able to see read receipts from other people. Read receipts are always sent for group chats."
          value={settings.showReadReceipts}
          onToggle={() => handleToggle('showReadReceipts')}
          disabled={updating}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* BLOCKED USERS MODAL */}
      <UserListModal
        visible={showBlocked}
        onClose={() => setShowBlocked(false)}
        title="Blocked accounts"
        users={blockedUsers}
        loading={blockedLoading}
        onAction={handleUnblock}
        actionLabel="Unblock"
      />

      {/* MUTED USERS MODAL */}
      <UserListModal
        visible={showMuted}
        onClose={() => setShowMuted(false)}
        title="Muted accounts"
        users={mutedUsers}
        loading={mutedLoading}
        onAction={handleUnmute}
        actionLabel="Unmute"
      />
    </SafeAreaView>
  );
};

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* Content */
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },

  /* Row Icon */
  rowIcon: {
    marginRight: 14,
  },

  /* Toggle Row */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 16,
  },
  toggleDesc: {
    color: '#888',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  /* Nav Row */
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navRowLabel: {
    color: '#fff',
    fontSize: 16,
  },
  navRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navRowCount: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },

  /* Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* User List */
  listContent: {
    paddingBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#0095f6',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Empty */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 15,
    marginTop: 12,
  },
});

export default PrivacySettingsScreen;