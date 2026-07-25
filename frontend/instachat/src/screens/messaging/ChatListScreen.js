import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import {
  fetchChats,
  fetchUnreadCount,
  setUnreadCount,
} from '../../redux/slices/chatSlice';
import ChatListItem from '../../components/molecules/ChatListItem';
import api from '../../services/api';
import { markAllAsRead } from '../../api/Chat.api';
import { getMyNote, setNote, deleteNote } from '../../api/Notes.api';
import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';

const NOTE_MAX_LEN = 60;
const PLACEHOLDER = 'https://via.placeholder.com/100';

const ChatListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { chats, chatsLoading, unreadCount } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  const [markingRead, setMarkingRead] = useState(false);
  const [search, setSearch] = useState('');
  const [myNote, setMyNote] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  /* =========================
     FETCH CHATS, UNREAD COUNT & MY NOTE
  ========================= */
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchChats());
      dispatch(fetchUnreadCount());
      getMyNote()
        .then(res => setMyNote(res?.data || null))
        .catch(() => {});
    }, [dispatch])
  );

  /* =========================
     NOTE COMPOSE
  ========================= */
  const openNoteModal = () => {
    setNoteText(myNote?.text || '');
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    setSavingNote(true);
    try {
      const res = await setNote(trimmed);
      setMyNote(res?.data || null);
      setNoteModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update your note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleClearNote = async () => {
    try {
      await deleteNote();
      setMyNote(null);
      setNoteModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove your note');
    }
  };

  /* =========================
     MARK ALL AS READ
  ========================= */
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert('No Unread Messages', 'You have no unread messages.');
      return;
    }

    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} messages as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Read',
          onPress: async () => {
            setMarkingRead(true);
            try {
              await markAllAsRead();
              dispatch(setUnreadCount(0));
              dispatch(fetchChats());
            } catch (error) {
              Alert.alert('Error', 'Failed to mark messages as read');
            } finally {
              setMarkingRead(false);
            }
          },
        },
      ]
    );
  };

  /* =========================
     OPEN CHAT
  ========================= */
  const handleOpenChat = async (otherUser) => {
    const res = await api.get(`/chats/with/${otherUser._id}`);
    const chat = res.data?.data;

    navigation.navigate(ROUTES.CHAT_DETAIL, {
      chatId: chat._id,
      username: otherUser.username,
      receiverId: otherUser._id,
    });
  };

  /* =========================
     ACTIVE CONTACTS ROW
     Derived from chats already in state — online contacts surface
     first, offline recent contacts still show after them.
  ========================= */
  const activeContacts = useMemo(() => {
    return chats
      .map(c => c.participants.find(p => p._id !== user._id))
      .filter(Boolean)
      .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
      .slice(0, 12);
  }, [chats, user._id]);

  /* =========================
     SEARCH FILTER (by contact name)
  ========================= */
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => {
      const other = c.participants.find(p => p._id !== user._id);
      return other?.username?.toLowerCase().includes(q);
    });
  }, [chats, search, user._id]);

  const renderItem = ({ item }) => {
    const otherUser = item.participants.find(p => p._id !== user._id);
    if (!otherUser) return null;

    return (
      <ChatListItem
        chat={item}
        otherUser={otherUser}
        currentUserId={user._id}
        onPress={() => handleOpenChat(otherUser)}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              disabled={markingRead}
              style={styles.headerIconBtn}
            >
              {markingRead ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="checkmark-done" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate(ROUTES.NEW_CHAT)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ACTIVE / NOTES ROW */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.activeRowList}
        data={activeContacts}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.activeRow}
        ListHeaderComponent={
          <TouchableOpacity style={styles.activeItem} onPress={openNoteModal}>
            <View style={styles.activeAvatarWrap}>
              {!!myNote?.text && (
                <View style={styles.noteBubble}>
                  <Text style={styles.noteBubbleText} numberOfLines={2}>
                    {myNote.text}
                  </Text>
                </View>
              )}
              <Image
                source={{ uri: user?.profilePicture || PLACEHOLDER }}
                style={styles.activeAvatar}
              />
              <View style={styles.notePlusBadge}>
                <Ionicons name={myNote ? 'create' : 'add'} size={12} color="#fff" />
              </View>
            </View>
            <Text style={styles.activeLabel} numberOfLines={1}>
              Your note
            </Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.activeItem} onPress={() => handleOpenChat(item)}>
            <View style={styles.activeAvatarWrap}>
              {!!item.note && (
                <View style={styles.noteBubble}>
                  <Text style={styles.noteBubbleText} numberOfLines={2}>
                    {item.note}
                  </Text>
                </View>
              )}
              <Image source={{ uri: item.profilePicture || PLACEHOLDER }} style={styles.activeAvatar} />
              {item.online && <View style={styles.activeOnlineDot} />}
            </View>
            <Text style={styles.activeLabel} numberOfLines={1}>
              {item.username}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionLabel}>RECENT</Text>

      {/* CHAT LIST */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshing={chatsLoading}
        onRefresh={() => {
          dispatch(fetchChats());
          dispatch(fetchUnreadCount());
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        ListEmptyComponent={
          !chatsLoading && (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyText}>
                {search ? 'No matching conversations' : 'No conversations yet'}
              </Text>
            </View>
          )
        }
      />

      {/* NOTE COMPOSE MODAL */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.noteModalBackdrop}>
          <View style={styles.noteModalCard}>
            <Text style={styles.noteModalTitle}>Share a note</Text>
            <Text style={styles.noteModalSubtitle}>
              Visible to your contacts for 24 hours
            </Text>

            <TextInput
              style={styles.noteInput}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textFaint}
              value={noteText}
              onChangeText={t => setNoteText(t.slice(0, NOTE_MAX_LEN))}
              maxLength={NOTE_MAX_LEN}
              autoFocus
              multiline
            />
            <Text style={styles.noteCounter}>
              {noteText.length}/{NOTE_MAX_LEN}
            </Text>

            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.noteModalCancel}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.noteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              {!!myNote && (
                <TouchableOpacity style={styles.noteModalClear} onPress={handleClearNote}>
                  <Text style={styles.noteModalClearText}>Remove</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.noteModalSave,
                  !noteText.trim() && styles.noteModalSaveDisabled,
                ]}
                onPress={handleSaveNote}
                disabled={!noteText.trim() || savingNote}
              >
                {savingNote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.noteModalSaveText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatListScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* SEARCH */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },

  /* ACTIVE ROW */
  activeRowList: {
    flexGrow: 0,
    // Pinned so the absolutely-positioned note bubble (which sits above
    // the avatar) can never inflate this row's measured height and push
    // everything below it further down than intended.
    height: 82,
  },
  activeRow: {
    paddingHorizontal: 16,
  },
  activeItem: {
    alignItems: 'center',
    width: 66,
    marginRight: 12,
  },
  activeAvatarWrap: {
    position: 'relative',
  },
  activeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceRaised,
  },
  activeOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  notePlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  activeLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 6,
    maxWidth: 66,
    textAlign: 'center',
  },
  noteBubble: {
    position: 'absolute',
    bottom: 46,
    left: -14,
    width: 84,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteBubbleText: {
    color: colors.textPrimary,
    fontSize: 10,
    lineHeight: 13,
  },

  /* SECTION LABEL */
  sectionLabel: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
  },

  /* EMPTY STATE */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
    marginTop: 10,
  },

  /* NOTE MODAL */
  noteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noteModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteModalTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  noteModalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  noteInput: {
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  noteCounter: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  noteModalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  noteModalCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  noteModalClear: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  noteModalClearText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  noteModalSave: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 72,
    alignItems: 'center',
  },
  noteModalSaveDisabled: {
    opacity: 0.5,
  },
  noteModalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
