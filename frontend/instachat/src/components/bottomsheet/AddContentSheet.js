import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors, { gradients } from '../../theme/colors';

const AddContentSheet = ({ visible, onClose, onPost, onReel, onStory }) => {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />

      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Create</Text>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <SheetItem
          icon="images-outline"
          label="Post"
          sub="Share a photo or video"
          gradient={gradients.post}
          onPress={onPost}
        />
        <SheetItem
          icon="videocam-outline"
          label="Reel"
          sub="Create a short video"
          gradient={gradients.reel}
          onPress={onReel}
        />
        <SheetItem
          icon="add-circle-outline"
          label="Story"
          sub="Share a moment"
          gradient={gradients.story}
          onPress={onStory}
        />
      </View>
    </Modal>
  );
};

const SheetItem = ({ icon, label, sub, gradient, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.iconTile}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </LinearGradient>
    <View style={styles.itemText}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,4,16,0.7)',
  },
  sheet: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    marginLeft: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default AddContentSheet;
