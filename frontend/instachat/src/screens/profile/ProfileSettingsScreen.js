import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { ROUTES } from '../../navigation/routes.constants';
import { disconnectSocket } from '../../services/socket';
import * as ImagePicker from 'expo-image-picker';

const THEMES = {
  day: {
    background: '#ffffff',
    text: '#000000',
    secondary: '#888888',
    border: '#eeeeee',
    danger: '#ED4956',
  },
  night: {
    background: '#000000',
    text: '#ffffff',
    secondary: '#888888',
    border: '#262626',
    danger: '#ff3b30',
  },
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    secondary: '#a8a8a8',
    border: '#2a2a2a',
    danger: '#ff4444',
  },
};

const BORDER_STYLES = [
  { id: 'none', name: 'None', gradient: null },
  { id: 'instagram', name: 'Instagram', gradient: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'] },
  { id: 'sunset', name: 'Sunset', gradient: ['#ff6b6b', '#feca57', '#ee5a24', '#ee5a24'] },
  { id: 'ocean', name: 'Ocean', gradient: ['#0575e6', '#021b79', '#00d2ff'] },
  { id: 'purple', name: 'Purple Dream', gradient: ['#c471f5', '#fa71cd', '#7b68ee'] },
  { id: 'fire', name: 'Fire', gradient: ['#ff0844', '#ffb199', '#ff6348'] },
  { id: 'mint', name: 'Mint', gradient: ['#00f260', '#0575e6', '#00d2ff'] },
];

const ACCENT_COLORS = [
  { id: 'blue', color: '#0095f6' },
  { id: 'purple', color: '#8b5cf6' },
  { id: 'pink', color: '#ec4899' },
  { id: 'green', color: '#10b981' },
  { id: 'orange', color: '#f97316' },
  { id: 'red', color: '#ef4444' },
];

const Row = ({ label, onPress, danger, theme }) => (
  <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]} onPress={onPress}>
    <Text style={[styles.text, { color: theme.text }, danger && { color: theme.danger }]}>
      {label}
    </Text>
    {!danger && <Ionicons name="chevron-forward" size={18} color={theme.secondary} />}
  </TouchableOpacity>
);

const ProfileSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const customization = useSelector(state => state.customization);

  const [showCustomization, setShowCustomization] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('night');
  const [accentColor, setAccentColor] = useState('#0095f6');
  const [borderStyle, setBorderStyle] = useState('instagram');
  const [backgroundImage, setBackgroundImage] = useState(null);

  const theme = THEMES[currentTheme];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          disconnectSocket();
          dispatch(logout());
        },
      },
    ]);
  };

  const pickBackgroundImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      setBackgroundImage(result.assets[0].uri);
    }
  };

  const clearBackground = () => {
    setBackgroundImage(null);
  };

  const saveCustomization = () => {
    // Save to Redux or AsyncStorage
    Alert.alert('Success', 'Customization saved!');
    setShowCustomization(false);
  };

  const renderContent = () => (
    <View style={styles.content}>
      <Text style={[styles.header, { color: theme.text }]}>Settings</Text>

      <Row
        label="UI Customization"
        theme={theme}
        onPress={() => setShowCustomization(true)}
      />
      <Row
        label="Account"
        theme={theme}
        onPress={() => navigation.navigate(ROUTES.ACCOUNT_SETTINGS)}
      />
      <Row
        label="Privacy"
        theme={theme}
        onPress={() => navigation.navigate(ROUTES.PRIVACY_SETTINGS)}
      />
      <Row
        label="Change Password"
        theme={theme}
        onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)}
      />
      <Row
        label="Security"
        theme={theme}
        onPress={() => navigation.navigate(ROUTES.SECURITY_SETTINGS)}
      />

      <View style={styles.divider} />

      <Row label="Logout" danger theme={theme} onPress={handleLogout} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {backgroundImage ? (
        <ImageBackground source={{ uri: backgroundImage }} style={styles.backgroundImage}>
          {renderContent()}
        </ImageBackground>
      ) : (
        renderContent()
      )}

      {/* CUSTOMIZATION MODAL */}
      <Modal
        visible={showCustomization}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCustomization(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* HEADER */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowCustomization(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>UI Customization</Text>
            <TouchableOpacity onPress={saveCustomization}>
              <Ionicons name="checkmark" size={28} color={accentColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* THEME MODE */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Mode</Text>
            <View style={styles.themeGrid}>
              {Object.keys(THEMES).map(themeKey => (
                <TouchableOpacity
                  key={themeKey}
                  style={[
                    styles.themeCard,
                    { backgroundColor: THEMES[themeKey].background },
                    currentTheme === themeKey && {
                      borderColor: accentColor,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => setCurrentTheme(themeKey)}
                >
                  <View
                    style={[
                      styles.themePreview,
                      { backgroundColor: THEMES[themeKey].background },
                    ]}
                  >
                    <View style={styles.themePreviewHeader} />
                    <View style={styles.themePreviewContent} />
                  </View>
                  <Text style={[styles.themeName, { color: THEMES[themeKey].text }]}>
                    {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ACCENT COLOR */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Accent Color</Text>
            <View style={styles.colorGrid}>
              {ACCENT_COLORS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: item.color },
                    accentColor === item.color && styles.colorCircleSelected,
                  ]}
                  onPress={() => setAccentColor(item.color)}
                >
                  {accentColor === item.color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* PROFILE BORDER */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile Border Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {BORDER_STYLES.map(border => (
                <TouchableOpacity
                  key={border.id}
                  style={[
                    styles.borderCard,
                    { backgroundColor: theme.border },
                    borderStyle === border.id && {
                      borderColor: accentColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setBorderStyle(border.id)}
                >
                  <View
                    style={[
                      styles.borderPreview,
                      border.gradient && {
                        borderWidth: 3,
                        borderColor: border.gradient[0],
                      },
                    ]}
                  >
                    <View style={styles.borderPreviewInner} />
                  </View>
                  <Text style={[styles.borderName, { color: theme.text }]}>{border.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* BACKGROUND IMAGE */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Background Image</Text>
            <View style={styles.backgroundSection}>
              {backgroundImage ? (
                <View style={styles.backgroundPreviewContainer}>
                  <ImageBackground
                    source={{ uri: backgroundImage }}
                    style={styles.backgroundPreview}
                  >
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={clearBackground}
                    >
                      <Ionicons name="close-circle" size={32} color="#fff" />
                    </TouchableOpacity>
                  </ImageBackground>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadButton, { borderColor: theme.border }]}
                  onPress={pickBackgroundImage}
                >
                  <Ionicons name="image-outline" size={40} color={theme.secondary} />
                  <Text style={[styles.uploadText, { color: theme.secondary }]}>
                    Choose Background
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* PREVIEW */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
            <View
              style={[
                styles.previewContainer,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <View style={styles.previewHeader}>
                <Text style={[styles.previewUsername, { color: theme.text }]}>
                  Your Profile
                </Text>
              </View>
              <View
                style={[
                  styles.previewAvatar,
                  borderStyle !== 'none' && {
                    borderWidth: 3,
                    borderColor: BORDER_STYLES.find(b => b.id === borderStyle)?.gradient?.[0] || accentColor,
                  },
                ]}
              />
              <TouchableOpacity
                style={[styles.previewButton, { backgroundColor: accentColor }]}
              >
                <Text style={styles.previewButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backgroundImage: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  text: {
    fontSize: 16,
  },

  divider: {
    height: 20,
  },

  /* MODAL */
  modalContainer: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  modalContent: {
    flex: 1,
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },

  /* THEME GRID */
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  themeCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  themePreview: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },

  themePreviewHeader: {
    height: 20,
    backgroundColor: '#333',
    marginBottom: 4,
  },

  themePreviewContent: {
    flex: 1,
    backgroundColor: '#555',
  },

  themeName: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* COLOR GRID */
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },

  /* BORDER STYLES */
  borderCard: {
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  borderPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  borderPreviewInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#888',
  },

  borderName: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* BACKGROUND */
  backgroundSection: {
    marginBottom: 20,
  },

  uploadButton: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },

  backgroundPreviewContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },

  backgroundPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  /* PREVIEW */
  previewContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },

  previewHeader: {
    marginBottom: 16,
  },

  previewUsername: {
    fontSize: 16,
    fontWeight: '700',
  },

  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#888',
    marginBottom: 16,
  },

  previewButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },

  previewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProfileSettingsScreen;