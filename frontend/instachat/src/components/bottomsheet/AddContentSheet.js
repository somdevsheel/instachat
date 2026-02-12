import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AddContentSheet = ({ visible, onClose, onPost, onReel, onStory }) => {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} />

      <View style={styles.sheet}>
        <SheetItem icon="images-outline" label="Post" onPress={onPost} />
        <SheetItem icon="videocam-outline" label="Reel" onPress={onReel} />
        <SheetItem icon="add-circle-outline" label="Story" onPress={onStory} />
      </View>
    </Modal>
  );
};

const SheetItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Ionicons name={icon} size={26} />
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  label: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
});

export default AddContentSheet;
