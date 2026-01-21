/**
 * MessageBubble.js
 *
 * SAFE – PLAIN TEXT ONLY – NO EFFECTS – NO ASYNC – NO LOOPS
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import colors from '../../theme/colors';
import { deleteMessage } from '../../redux/slices/chatSlice';

const MessageBubble = ({ message, isOwnMessage }) => {
  const dispatch = useDispatch();

  if (!message) return null;

  /* =========================
     MESSAGE TEXT (SYNC)
  ========================= */
  let displayText = '';

  if (message.deletedForEveryone) {
    displayText = 'This message was deleted';
  } else if (typeof message.text === 'string') {
    displayText = message.text;
  } else {
    displayText = 'Message';
  }

  /* =========================
     READ STATUS
  ========================= */
  const isRead =
    isOwnMessage &&
    Array.isArray(message.readBy) &&
    message.readBy.length > 1;

  /* =========================
     LONG PRESS ACTIONS
  ========================= */
  const onLongPress = () => {
    const options = [
      {
        text: 'Delete for me',
        onPress: () =>
          dispatch(
            deleteMessage({
              messageId: message._id,
              mode: 'me',
            })
          ),
      },
    ];

    if (isOwnMessage) {
      options.push({
        text: 'Delete for everyone',
        style: 'destructive',
        onPress: () =>
          dispatch(
            deleteMessage({
              messageId: message._id,
              mode: 'everyone',
            })
          ),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Options', '', options);
  };

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={300}
      style={[styles.wrap, isOwnMessage ? styles.own : styles.other]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            message.deletedForEveryone && styles.deleted,
          ]}
        >
          {displayText}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.time}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {isOwnMessage && (
          <Text style={[styles.tick, isRead && styles.tickRead]}>
            {isRead ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default MessageBubble;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  wrap: { marginBottom: 10, maxWidth: '80%' },
  own: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  other: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  bubble: {
    padding: 12,
    borderRadius: 20,
    minWidth: 50,
  },
  ownBubble: {
    backgroundColor: colors?.primary || '#0095f6',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#262626',
    borderBottomLeftRadius: 2,
  },

  text: {
    fontSize: 16,
    color: '#fff',
  },
  deleted: {
    fontStyle: 'italic',
    opacity: 0.7,
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 10,
    color: '#8e8e8e',
    marginRight: 6,
  },
  tick: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  tickRead: {
    color: '#0095f6',
    fontWeight: '600',
  },
});
