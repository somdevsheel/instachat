// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const SecuritySettingsScreen = () => {
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.header}>Security</Text>

//       <Text style={styles.item}>Change password</Text>
//       <Text style={styles.item}>Login activity</Text>
//       <Text style={styles.item}>Two-factor authentication</Text>
//       <Text style={styles.item}>Emails from Instagram</Text>
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

// export default SecuritySettingsScreen;







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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../../navigation/routes.constants';
import { getLoginActivity, toggleTwoFactor } from '../../api/User.api';

/* =========================
   HELPER: Format Date
========================= */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/* =========================
   ROW COMPONENT
========================= */

const Row = ({ icon, label, description, onPress, rightElement }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={0.6}
    disabled={!onPress}
  >
    <View style={styles.rowLeft}>
      {icon && (
        <Ionicons
          name={icon}
          size={22}
          color="#fff"
          style={styles.rowIcon}
        />
      )}
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? (
          <Text style={styles.rowDesc}>{description}</Text>
        ) : null}
      </View>
    </View>
    {rightElement || (
      <Ionicons name="chevron-forward" size={18} color="#555" />
    )}
  </TouchableOpacity>
);

/* =========================
   LOGIN ACTIVITY MODAL
========================= */

const LoginActivityModal = ({ visible, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchSessions();
    }
  }, [visible]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getLoginActivity();
      if (res.success) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error('Fetch login activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device) => {
    const d = (device || '').toLowerCase();
    if (d.includes('iphone') || d.includes('ios')) return 'phone-portrait-outline';
    if (d.includes('android')) return 'phone-portrait-outline';
    if (d.includes('mac') || d.includes('windows') || d.includes('desktop'))
      return 'desktop-outline';
    if (d.includes('tablet') || d.includes('ipad')) return 'tablet-portrait-outline';
    return 'hardware-chip-outline';
  };

  const renderSession = ({ item }) => (
    <View style={styles.sessionRow}>
      <View style={styles.sessionIconContainer}>
        <Ionicons
          name={getDeviceIcon(item.device)}
          size={24}
          color={item.isCurrent ? '#0095f6' : '#888'}
        />
      </View>
      <View style={styles.sessionInfo}>
        <View style={styles.sessionTop}>
          <Text style={styles.sessionDevice}>{item.device}</Text>
          {item.isCurrent && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active now</Text>
            </View>
          )}
        </View>
        <Text style={styles.sessionLocation}>
          {item.location}
          {item.ip ? ` · ${item.ip}` : ''}
        </Text>
        {!item.isCurrent && (
          <Text style={styles.sessionTime}>
            {formatDate(item.loginAt)}
          </Text>
        )}
      </View>
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
          <Text style={styles.modalTitle}>Login activity</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No login activity</Text>
            <Text style={styles.emptyDesc}>
              Your recent login sessions will appear here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.activityNote}>
              <Text style={styles.activityNoteText}>
                This is a list of devices that have logged into your
                account. If you see a login you don't recognize, change
                your password immediately.
              </Text>
            </View>
            <FlatList
              data={sessions}
              keyExtractor={(item, index) =>
                item._id || `session-${index}`
              }
              renderItem={renderSession}
              contentContainerStyle={styles.listContent}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

/* =========================
   MAIN SCREEN
========================= */

const SecuritySettingsScreen = ({ navigation }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginActivity, setShowLoginActivity] = useState(false);

  /* =========================
     TOGGLE 2FA
  ========================= */
  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;

    // Optimistic
    setTwoFactorEnabled(newValue);

    try {
      setLoading(true);
      const res = await toggleTwoFactor();

      if (res.success) {
        setTwoFactorEnabled(res.twoFactorEnabled);
        Alert.alert(
          res.twoFactorEnabled
            ? 'Two-Factor Enabled'
            : 'Two-Factor Disabled',
          res.message
        );
      } else {
        setTwoFactorEnabled(!newValue);
      }
    } catch (err) {
      setTwoFactorEnabled(!newValue);
      Alert.alert('Error', 'Failed to update two-factor setting');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SECTION: Login Security */}
        <Text style={styles.sectionTitle}>Login Security</Text>

        <Row
          icon="key-outline"
          label="Change password"
          description="Last changed: recently"
          onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)}
        />

        <Row
          icon="time-outline"
          label="Login activity"
          description="See where your account is logged in"
          onPress={() => setShowLoginActivity(true)}
        />

        {/* SECTION: Two-Factor Auth */}
        <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>

        <Row
          icon="shield-checkmark-outline"
          label="Two-factor authentication"
          description={
            twoFactorEnabled
              ? 'Enabled — An OTP will be sent to your email on new logins'
              : 'Add an extra layer of security to your account'
          }
          onPress={null}
          rightElement={
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              disabled={loading}
              trackColor={{ false: '#333', true: '#0095f6' }}
              thumbColor={twoFactorEnabled ? '#fff' : '#888'}
              ios_backgroundColor="#333"
            />
          }
        />

        {/* SECTION: Data & Info */}
        <Text style={styles.sectionTitle}>Data and information</Text>

        <Row
          icon="download-outline"
          label="Download your data"
          description="Request a copy of your InstaChat data"
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Data download will be available in a future update.'
            )
          }
        />

        <Row
          icon="mail-outline"
          label="Emails from InstaChat"
          description="See security and login emails sent to you"
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Email log will be available in a future update.'
            )
          }
        />

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#888"
          />
          <Text style={styles.infoCardText}>
            We recommend using a strong, unique password that you don't
            use anywhere else, and enabling two-factor authentication to
            keep your account secure.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* LOGIN ACTIVITY MODAL */}
      <LoginActivityModal
        visible={showLoginActivity}
        onClose={() => setShowLoginActivity(false)}
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

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  rowIcon: {
    marginRight: 14,
    marginTop: 1,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
  },
  rowDesc: {
    color: '#888',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  /* Info Card */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0a0a0a',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#1a1a1a',
  },
  infoCardText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    marginLeft: 10,
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

  /* Activity Note */
  activityNote: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  activityNoteText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },

  /* Session Row */
  listContent: {
    paddingBottom: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  sessionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  sessionDevice: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#1a3a1a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionLocation: {
    color: '#888',
    fontSize: 13,
  },
  sessionTime: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },

  /* Empty */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyDesc: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default SecuritySettingsScreen;