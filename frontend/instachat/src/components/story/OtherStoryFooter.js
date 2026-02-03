import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getOrCreateChat, sendMessage } from '../../api/Chat.api';
import { reactToStory } from '../../api/Story.api';

// Reaction options
const REACTIONS = [
  { type: 'like', emoji: '❤️', color: '#ff3b30' },
  { type: 'love', emoji: '😍', color: '#ff3b30' },
  { type: 'haha', emoji: '😂', color: '#ffd700' },
  { type: 'wow', emoji: '😮', color: '#0095f6' },
  { type: 'sad', emoji: '😢', color: '#a0a0a0' },
  { type: 'angry', emoji: '😡', color: '#ff6b00' },
];

const OtherStoryFooter = ({
  storyId,
  receiverId,
  onPause,
  onResume,
  onSendStart,
  onSendEnd,
}) => {
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Animation for heart popup
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation for reaction picker
  const pickerScale = useRef(new Animated.Value(0)).current;
  const pickerOpacity = useRef(new Animated.Value(0)).current;

  // Long press timer
  const longPressTimer = useRef(null);

  /* =========================
     STORY CONTROL
  ========================= */
  const pauseStory = () => onPause?.();

  const resumeStoryIfSafe = () => {
    if (!text.trim() && !emojiOpen) {
      onResume?.();
    }
  };

  /* =========================
     INPUT EVENTS
  ========================= */
  const handleFocus = () => {
    pauseStory();
  };

  const handleBlur = () => {
    resumeStoryIfSafe();
  };

  /* =========================
     EMOJI TOGGLE
  ========================= */
  const toggleEmoji = () => {
    if (emojiOpen) {
      setEmojiOpen(false);
      resumeStoryIfSafe();
    } else {
      Keyboard.dismiss();
      setEmojiOpen(true);
      pauseStory();
    }
  };

  /* =========================
     REACTION PICKER ANIMATIONS
  ========================= */
  const showPicker = () => {
    setShowReactionPicker(true);
    pauseStory(); // Pause story while picker is open

    pickerScale.setValue(0.5);
    pickerOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(pickerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(pickerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hidePicker = () => {
    Animated.parallel([
      Animated.timing(pickerScale, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pickerOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowReactionPicker(false);
      resumeStoryIfSafe();
    });
  };

  /* =========================
     HEART REACTION (QUICK TAP)
  ========================= */
  const handleQuickReaction = async () => {
    if (isLiked) return; // Already reacted

    await sendReaction('like', '❤️');
  };

  /* =========================
     SEND REACTION (ANY TYPE)
  ========================= */
  const sendReaction = async (type, emoji) => {
    if (isLiked) return; // Already reacted

    // 1️⃣ Update UI immediately
    setIsLiked(true);
    setSelectedReaction({ type, emoji });

    // 2️⃣ Trigger heart animation
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.5,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3️⃣ Send reaction to backend
    try {
      await reactToStory(storyId, type);
    } catch (e) {
      console.warn('❌ Failed to react to story', e);
    }
  };

  /* =========================
     HEART BUTTON LONG PRESS
  ========================= */
  const handleHeartPressIn = () => {
    // Start timer for long press
    longPressTimer.current = setTimeout(() => {
      showPicker();
    }, 300); // Show picker after 300ms
  };

  const handleHeartPressOut = () => {
    // Clear timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If picker is not showing, it was a quick tap
    if (!showReactionPicker && !isLiked) {
      handleQuickReaction();
    }
  };

  /* =========================
     SELECT REACTION FROM PICKER
  ========================= */
  const selectReaction = (type, emoji) => {
    hidePicker();
    sendReaction(type, emoji);
  };

  /* =========================
     SEND STORY REPLY
  ========================= */
  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();

    // 1️⃣ PAUSE STORY AND SET SENDING FLAG
    setSending(true);
    onSendStart?.();
    pauseStory();

    // 2️⃣ NOW dismiss keyboard
    Keyboard.dismiss();

    try {
      // 3️⃣ Get or create chat
      const chatRes = await getOrCreateChat(receiverId);
      const chat = chatRes.data;

      // 4️⃣ Send message
      await sendMessage({
        chatId: chat._id,
        receiverId,
        text: messageText,
        storyId,
      });

      // 5️⃣ Clear input
      setText('');
      setEmojiOpen(false);
    } catch (e) {
      console.warn('❌ Story reply failed', e);
    } finally {
      setSending(false);
      onSendEnd?.();

      // 6️⃣ Resume
      requestAnimationFrame(() => {
        onResume?.();
      });
    }
  };

  const isTyping = text.trim().length > 0;

  // Get reaction icon for display
  const getReactionIcon = () => {
    if (!selectedReaction) return null;
    const reaction = REACTIONS.find(r => r.type === selectedReaction.type);
    return reaction?.emoji || '❤️';
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.replyBar}>
        {/* INPUT PILL */}
        <View style={styles.inputPill}>
          <TouchableOpacity onPress={toggleEmoji}>
            <Ionicons
              name={emojiOpen ? 'keyboard-outline' : 'happy-outline'}
              size={20}
              color="#ccc"
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Send message"
            placeholderTextColor="#aaa"
            value={text}
            onChangeText={setText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!sending}
            multiline={false}
          />

          {/* SEND INSIDE INPUT (ONLY WHEN TYPING) */}
          {isTyping && (
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              style={styles.sendInside}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="paper-plane" size={18} color="#0095f6" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* RIGHT ICON (ONLY WHEN NOT TYPING) */}
        {!isTyping && (
          <TouchableOpacity
            style={styles.rightIcons}
            onPressIn={handleHeartPressIn}
            onPressOut={handleHeartPressOut}
            activeOpacity={0.7}
            disabled={isLiked}
          >
            {isLiked && selectedReaction ? (
              <Text style={styles.reactionEmoji}>{getReactionIcon()}</Text>
            ) : (
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#ff3b30' : '#fff'}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* REACTION PICKER (LONG PRESS) */}
      {showReactionPicker && (
        <Animated.View
          style={[
            styles.reactionPicker,
            {
              transform: [{ scale: pickerScale }],
              opacity: pickerOpacity,
            },
          ]}
        >
          {REACTIONS.map((reaction) => (
            <TouchableOpacity
              key={reaction.type}
              style={styles.reactionButton}
              onPress={() => selectReaction(reaction.type, reaction.emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionButtonEmoji}>{reaction.emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* ANIMATED HEART POPUP */}
      {isLiked && (
        <Animated.View
          style={[
            styles.heartPopup,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.heartPopupEmoji}>
            {getReactionIcon() || '❤️'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

export default OtherStoryFooter;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },

  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },

  sendInside: {
    marginLeft: 6,
  },

  rightIcons: {
    marginLeft: 12,
  },

  reactionEmoji: {
    fontSize: 22,
  },

  heartPopup: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 100,
  },

  heartPopupEmoji: {
    fontSize: 100,
  },

  reactionPicker: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  reactionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  reactionButtonEmoji: {
    fontSize: 28,
  },
});