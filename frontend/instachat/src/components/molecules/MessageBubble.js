import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import colors from '../../theme/colors';
import { decryptMessage } from '../../utils/crypto';
import { deleteMessage } from '../../redux/slices/chatSlice';
import Storage from '../../utils/storage';

const MessageBubble = ({ message, isOwnMessage }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // ✅ Get stored plaintext for sent messages
  const sentMessagesPlaintext = useSelector(state => state.chat.sentMessagesPlaintext);

  const [text, setText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  /* =========================
     READ RECEIPT LOGIC
  ========================= */
  const isRead =
    isOwnMessage &&
    Array.isArray(message.readBy) &&
    message.readBy.some(
      r => r.user?.toString?.() !== user?._id
    );

  /* =========================
     DECRYPT MESSAGE FOR THIS DEVICE
  ========================= */
  useEffect(() => {
    let mounted = true;

    const decrypt = async () => {
      try {
        // Handle deleted messages
        if (message.deletedForEveryone) {
          if (mounted) setText('This message was deleted');
          return;
        }

        // ✅ For own messages, use stored plaintext
        if (isOwnMessage) {
          const storedPlaintext = sentMessagesPlaintext[message._id];
          if (storedPlaintext) {
            if (mounted) setText(storedPlaintext);
            return;
          }
          
          // Old sent messages (before fix) - can't be decrypted
          if (mounted) setText('[Message sent]');
          return;
        }

        // ✅ Check if message has new multi-device format
        const encryptedPayloads = message.encryptedPayloads;
        
        // Handle old single-device messages (before multi-device fix)
        if (!encryptedPayloads || !Array.isArray(encryptedPayloads)) {
          // Legacy format: message.cipherText and message.nonce
          if (message.cipherText && message.nonce) {
            setIsDecrypting(true);
            
            try {
              const senderId =
                typeof message.sender === 'string'
                  ? message.sender
                  : message.sender?._id;

              const plainText = await decryptMessage({
                cipherText: message.cipherText,
                nonce: message.nonce,
                senderId,
              });

              if (mounted) {
                setText(plainText);
                setIsDecrypting(false);
              }
            } catch (legacyErr) {
              // Old message with corrupted/incompatible encryption
              if (mounted) {
                setText('🔒 [Old encrypted message]');
                setIsDecrypting(false);
              }
            }
          } else {
            if (mounted) setText('🔒 [Encrypted message]');
          }
          return;
        }

        // ✅ New multi-device format: Find payload for current device
        const deviceId = await Storage.getDeviceId();
        const myPayload = encryptedPayloads.find(
          p => p.deviceId === deviceId
        );

        if (!myPayload) {
          if (mounted) {
            setText('🔒 Encrypted for another device');
          }
          return;
        }

        setIsDecrypting(true);

        const senderId =
          typeof message.sender === 'string'
            ? message.sender
            : message.sender?._id;

        const plainText = await decryptMessage({
          cipherText: myPayload.cipherText,
          nonce: myPayload.nonce,
          senderId,
        });

        if (mounted) {
          setText(plainText);
          setIsDecrypting(false);
        }
      } catch (err) {
        // Silently handle old message decryption errors
        if (mounted) {
          setText(isOwnMessage ? '[Message sent]' : '🔒 Unable to decrypt');
          setIsDecrypting(false);
        }
      }
    };

    decrypt();
    
    return () => {
      mounted = false;
    };
  }, [message, isOwnMessage, sentMessagesPlaintext]);

  /* =========================
     DELETE HANDLER
  ========================= */
  const handleLongPress = () => {
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
    Alert.alert('Message options', '', options);
  };

  // ✅ Display text with proper fallback
  const displayText = isDecrypting 
    ? 'Loading…' 
    : text || (message.deletedForEveryone ? 'This message was deleted' : '');

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={[
        styles.container,
        isOwnMessage
          ? styles.ownMessageContainer
          : styles.otherMessageContainer,
      ]}
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
            isOwnMessage ? styles.ownText : styles.otherText,
            message.deletedForEveryone && styles.deletedText,
          ]}
        >
          {displayText}
        </Text>
      </View>

      {/* TIME + TICKS */}
      <View style={styles.metaRow}>
        <Text style={styles.time}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {isOwnMessage && (
          <Text
            style={[
              styles.tick,
              isRead && styles.tickRead,
            ]}
          >
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
  container: {
    marginBottom: 10,
    maxWidth: '80%',
  },

  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },

  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },

  bubble: {
    padding: 12,
    borderRadius: 20,
    minWidth: 50,
  },

  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },

  otherBubble: {
    backgroundColor: '#EFEFEF',
    borderBottomLeftRadius: 2,
  },

  text: {
    fontSize: 16,
  },

  ownText: {
    color: 'white',
  },

  otherText: {
    color: 'black',
  },

  deletedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  time: {
    fontSize: 10,
    color: colors.textSecondary,
    marginRight: 6,
  },

  tick: {
    fontSize: 12,
    color: '#999',
  },

  tickRead: {
    color: colors.primary,
    fontWeight: '600',
  },
});