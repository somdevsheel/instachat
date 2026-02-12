// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { ROUTES } from '../../navigation/routes.constants';

// const Row = ({ label, onPress }) => (
//   <TouchableOpacity style={styles.row} onPress={onPress}>
//     <Text style={styles.text}>{label}</Text>
//     <Ionicons name="chevron-forward" size={18} color="#888" />
//   </TouchableOpacity>
// );

// const AccountSettingsScreen = ({ navigation }) => {
//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.header}>Account</Text>

//       <Row
//         label="Username"
//         onPress={() => {
//           // future: edit username
//         }}
//       />

//       <Row
//         label="Email"
//         onPress={() => {
//           // future: change email
//         }}
//       />

//       <Row
//         label="Phone number"
//         onPress={() => {
//           // future: change phone
//         }}
//       />

//       <Row
//         label="Personal information"
//         onPress={() => {
//           // future: personal info screen
//         }}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 20,
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   row: {
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   text: {
//     fontSize: 16,
//   },
// });

// export default AccountSettingsScreen;











import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser, logout } from '../../redux/slices/authSlice';
import { getAccountInfo, updateAccountInfo, deleteAccount } from '../../api/User.api';

/* =========================
   CONSTANTS
========================= */

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

/* =========================
   ROW COMPONENT
========================= */

const Row = ({ icon, label, value, onPress, danger }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={styles.rowLeft}>
      {icon && (
        <Ionicons
          name={icon}
          size={22}
          color={danger ? '#ED4956' : '#fff'}
          style={styles.rowIcon}
        />
      )}
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
        {value ? (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
    </View>
    {!danger && (
      <Ionicons name="chevron-forward" size={18} color="#555" />
    )}
  </TouchableOpacity>
);

/* =========================
   EDIT MODAL
========================= */

const EditModal = ({
  visible,
  onClose,
  title,
  value,
  onSave,
  placeholder,
  keyboardType,
  maxLength,
  loading,
}) => {
  const [text, setText] = useState(value || '');

  useEffect(() => {
    if (visible) setText(value || '');
  }, [visible, value]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={() => onSave(text)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0095f6" />
              ) : (
                <Text style={styles.modalDone}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.modalBody}>
            <Text style={styles.modalInputLabel}>{title}</Text>
            <TextInput
              style={styles.modalInput}
              value={text}
              onChangeText={setText}
              placeholder={placeholder || `Enter ${title.toLowerCase()}`}
              placeholderTextColor="#555"
              keyboardType={keyboardType || 'default'}
              maxLength={maxLength || 100}
              autoFocus
              autoCapitalize="none"
              selectionColor="#0095f6"
            />
            <View style={styles.modalInputLine} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

/* =========================
   GENDER PICKER MODAL
========================= */

const GenderModal = ({ visible, onClose, currentValue, onSave, loading }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={false}
    onRequestClose={onClose}
  >
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Gender</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.modalBody}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.genderOption}
            onPress={() => onSave(option.value)}
            disabled={loading}
          >
            <Text style={styles.genderLabel}>{option.label}</Text>
            {currentValue === option.value && (
              <Ionicons name="checkmark" size={22} color="#0095f6" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  </Modal>
);

/* =========================
   MAIN SCREEN
========================= */

const AccountSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [accountData, setAccountData] = useState({
    username: '',
    email: '',
    phone: '',
    name: '',
    gender: '',
    dateOfBirth: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [editField, setEditField] = useState(null); // 'username' | 'email' | 'phone' | 'name'
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* =========================
     FETCH ACCOUNT DATA
  ========================= */
  const fetchAccountInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAccountInfo();
      if (res.success) {
        setAccountData(res.data);
      }
    } catch (err) {
      console.error('Fetch account info error:', err);
      // Fallback to Redux user data
      if (user) {
        setAccountData({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          name: user.name || '',
          gender: user.gender || '',
          dateOfBirth: user.dateOfBirth || null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccountInfo();
  }, [fetchAccountInfo]);

  /* =========================
     SAVE FIELD
  ========================= */
  const handleSaveField = async (field, value) => {
    try {
      setSaving(true);
      const res = await updateAccountInfo({ [field]: value });

      if (res.success) {
        setAccountData((prev) => ({ ...prev, [field]: value }));
        setEditField(null);
        setShowGenderModal(false);

        // Refresh user in Redux
        dispatch(loadUser());
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     DELETE ACCOUNT
  ========================= */
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      return Alert.alert('Error', 'Password is required');
    }

    try {
      setDeleteLoading(true);
      const res = await deleteAccount(deletePassword);

      if (res.success) {
        Alert.alert(
          'Account Deleted',
          'Your account has been permanently deleted.',
          [
            {
              text: 'OK',
              onPress: () => dispatch(logout()),
            },
          ]
        );
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed';
      Alert.alert('Error', msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* =========================
     GET DISPLAY VALUES
  ========================= */
  const getGenderLabel = (val) => {
    const option = GENDER_OPTIONS.find((o) => o.value === val);
    return option ? option.label : 'Not set';
  };

  const getEditConfig = () => {
    switch (editField) {
      case 'username':
        return {
          title: 'Username',
          value: accountData.username,
          placeholder: 'Enter username',
          keyboardType: 'default',
          maxLength: 30,
        };
      case 'email':
        return {
          title: 'Email',
          value: accountData.email,
          placeholder: 'Enter email address',
          keyboardType: 'email-address',
          maxLength: 100,
        };
      case 'phone':
        return {
          title: 'Phone number',
          value: accountData.phone,
          placeholder: 'Enter phone number',
          keyboardType: 'phone-pad',
          maxLength: 15,
        };
      case 'name':
        return {
          title: 'Name',
          value: accountData.name,
          placeholder: 'Enter your name',
          keyboardType: 'default',
          maxLength: 50,
        };
      default:
        return null;
    }
  };

  const editConfig = getEditConfig();

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
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SECTION: Account Info */}
        <Text style={styles.sectionTitle}>Account information</Text>

        <Row
          icon="person-outline"
          label="Username"
          value={`@${accountData.username}`}
          onPress={() => setEditField('username')}
        />
        <Row
          icon="mail-outline"
          label="Email"
          value={accountData.email}
          onPress={() => setEditField('email')}
        />
        <Row
          icon="call-outline"
          label="Phone number"
          value={accountData.phone || 'Not set'}
          onPress={() => setEditField('phone')}
        />

        {/* SECTION: Personal Info */}
        <Text style={styles.sectionTitle}>Personal information</Text>
        <Text style={styles.sectionDesc}>
          Provide your personal information, even if the account is used
          for a business, pet, or something else. This won't be part of
          your public profile.
        </Text>

        <Row
          icon="text-outline"
          label="Name"
          value={accountData.name || 'Not set'}
          onPress={() => setEditField('name')}
        />
        <Row
          icon="male-female-outline"
          label="Gender"
          value={getGenderLabel(accountData.gender)}
          onPress={() => setShowGenderModal(true)}
        />

        {/* SECTION: Account Actions */}
        <Text style={styles.sectionTitle}>Account actions</Text>

        <Row
          icon="trash-outline"
          label="Delete account"
          danger
          onPress={() => setShowDeleteConfirm(true)}
        />
      </ScrollView>

      {/* EDIT MODAL */}
      {editConfig && (
        <EditModal
          visible={!!editField}
          onClose={() => setEditField(null)}
          title={editConfig.title}
          value={editConfig.value}
          placeholder={editConfig.placeholder}
          keyboardType={editConfig.keyboardType}
          maxLength={editConfig.maxLength}
          loading={saving}
          onSave={(val) => handleSaveField(editField, val)}
        />
      )}

      {/* GENDER MODAL */}
      <GenderModal
        visible={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        currentValue={accountData.gender}
        loading={saving}
        onSave={(val) => handleSaveField('gender', val)}
      />

      {/* DELETE ACCOUNT MODAL */}
      <Modal
        visible={showDeleteConfirm}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <View style={{ width: 50 }} />
            </View>

            <View style={styles.deleteBody}>
              <Ionicons
                name="warning-outline"
                size={48}
                color="#ED4956"
                style={{ alignSelf: 'center', marginBottom: 16 }}
              />
              <Text style={styles.deleteWarningTitle}>
                Are you sure?
              </Text>
              <Text style={styles.deleteWarningText}>
                This action is permanent and cannot be undone. All your
                posts, messages, followers, and data will be permanently
                deleted.
              </Text>

              <Text style={styles.modalInputLabel}>
                Enter your password to confirm
              </Text>
              <TextInput
                style={styles.modalInput}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Password"
                placeholderTextColor="#555"
                secureTextEntry
                autoFocus
                selectionColor="#ED4956"
              />
              <View
                style={[styles.modalInputLine, { backgroundColor: '#ED4956' }]}
              />

              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  !deletePassword && styles.deleteBtnDisabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={!deletePassword || deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteBtnText}>
                    Permanently Delete Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  sectionDesc: {
    color: '#555',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
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
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
  },
  rowValue: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  dangerText: {
    color: '#ED4956',
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
  modalCancel: {
    color: '#fff',
    fontSize: 16,
  },
  modalDone: {
    color: '#0095f6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalInputLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
  },
  modalInputLine: {
    height: 1,
    backgroundColor: '#333',
  },

  /* Gender */
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  genderLabel: {
    color: '#fff',
    fontSize: 16,
  },

  /* Delete */
  deleteBody: {
    padding: 20,
  },
  deleteWarningTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteWarningText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteBtn: {
    backgroundColor: '#ED4956',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountSettingsScreen;