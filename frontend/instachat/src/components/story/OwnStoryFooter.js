import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStoryViewers } from '../../api/Story.api';

const PLACEHOLDER = 'https://via.placeholder.com/40';

/**
 * OwnStoryFooter
 * - Shows viewer count
 * - Opens viewer list with reactions
 * - Pauses / resumes story via callbacks
 */
const OwnStoryFooter = ({
  storyId,
  viewerCount,
  onOpen,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewers, setViewers] = useState([]);

  const open = async () => {
    if (!storyId) return;

    // 🔴 PAUSE STORY
    onOpen?.();

    setVisible(true);
    setLoading(true);

    try {
      const res = await getStoryViewers(storyId);
      const viewersData = res.data || [];
      
      // Process viewers to include their reactions if any
      const processedViewers = viewersData.map(viewer => ({
        ...viewer,
        hasReacted: !!viewer.reaction,
        reactionType: viewer.reaction?.type || null,
      }));
      
      setViewers(processedViewers);
    } catch (error) {
      console.error('Failed to fetch viewers:', error);
      setViewers([]);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setVisible(false);

    // ▶️ RESUME STORY
    onClose?.();
  };

  // Get reaction icon based on type
  const getReactionEmoji = (type) => {
    const reactionMap = {
      'like': '❤️',
      'love': '😍',
      'haha': '😂',
      'wow': '😮',
      'sad': '😢',
      'angry': '😡',
    };
    return reactionMap[type] || '❤️';
  };

  return (
    <>
      {/* FOOTER */}
      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={styles.viewerRow}
          onPress={open}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.viewerText}>{viewerCount} viewers</Text>
        </TouchableOpacity>
      </View>

      {/* VIEWERS MODAL */}
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* HEADER */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Viewers</Text>
              <TouchableOpacity onPress={close}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* LIST */}
            {loading ? (
              <ActivityIndicator
                style={{ marginTop: 20 }}
                color="#fff"
              />
            ) : (
              <FlatList
                data={viewers}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <View style={styles.viewerItem}>
                    <View style={styles.viewerLeft}>
                      <Image
                        source={{
                          uri: item.profilePicture || PLACEHOLDER,
                        }}
                        style={styles.avatar}
                      />
                      <Text style={styles.username}>
                        {item.username}
                      </Text>
                    </View>

                    {/* REACTION EMOJI */}
                    {item.hasReacted && (
                      <Text style={styles.reactionEmoji}>
                        {getReactionEmoji(item.reactionType)}
                      </Text>
                    )}
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No viewers yet</Text>
                }
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default OwnStoryFooter;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingTop: 12,
    alignItems: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerText: {
    color: '#fff',
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111',
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  viewerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  username: {
    color: '#fff',
    fontSize: 14,
  },
  reactionEmoji: {
    fontSize: 20,
    marginLeft: 8,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});