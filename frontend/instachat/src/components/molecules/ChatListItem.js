// /**
//  * ChatListItem.js
//  *
//  * SAFE – PLAIN TEXT ONLY – NO EFFECTS – NO LOOPS
//  */

// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const ChatListItem = ({ chat, otherUser, currentUserId, onPress }) => {
//   const lastMessage = chat.lastMessage;

//   const isSentByMe =
//     lastMessage &&
//     (typeof lastMessage.sender === 'string'
//       ? lastMessage.sender === currentUserId
//       : lastMessage.sender?._id === currentUserId);

//   /* =========================
//      PREVIEW TEXT (SYNC)
//   ========================= */
//   let previewText = 'Start chatting';

//   if (lastMessage) {
//     if (lastMessage.deletedForEveryone) {
//       previewText = '🚫 Message deleted';
//     } else if (typeof lastMessage.text === 'string') {
//       previewText = isSentByMe
//         ? `You: ${lastMessage.text}`
//         : lastMessage.text;
//     } else {
//       previewText = 'Message';
//     }
//   }

//   /* =========================
//      TIME TEXT
//   ========================= */
//   const timeText = lastMessage
//     ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       })
//     : '';

//   return (
//     <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
//       {/* Avatar */}
//       <Image
//         source={{
//           uri: otherUser?.profilePicture || 'https://via.placeholder.com/100',
//         }}
//         style={styles.avatar}
//       />

//       {/* Content */}
//       <View style={styles.middle}>
//         <View style={styles.topLine}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser?.username || 'User'}
//           </Text>
//           {!!timeText && <Text style={styles.time}>{timeText}</Text>}
//         </View>

//         <View style={styles.bottomLine}>
//           <Text style={styles.preview} numberOfLines={1}>
//             {previewText}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// export default ChatListItem;

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     backgroundColor: '#000',
//   },
//   avatar: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     marginRight: 12,
//     backgroundColor: '#262626',
//   },
//   middle: {
//     flex: 1,
//   },
//   topLine: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   username: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     maxWidth: '75%',
//   },
//   time: {
//     color: '#777',
//     fontSize: 12,
//   },
//   bottomLine: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   preview: {
//     color: '#777',
//     fontSize: 14,
//     flex: 1,
//   },
// });





/**
 * ChatListItem.js
 *
 * SAFE — PLAIN TEXT ONLY — NO EFFECTS — NO LOOPS
 * + Shared Post/Reel preview support
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatListItem = ({ chat, otherUser, currentUserId, onPress }) => {
  const lastMessage = chat.lastMessage;

  const isSentByMe =
    lastMessage &&
    (typeof lastMessage.sender === 'string'
      ? lastMessage.sender === currentUserId
      : lastMessage.sender?._id === currentUserId);

  /* =========================
     PREVIEW TEXT (SYNC)
  ========================= */
  let previewText = 'Start chatting';
  let previewIcon = null;

  if (lastMessage) {
    if (lastMessage.deletedForEveryone) {
      previewText = '🚫 Message deleted';
    } else if (lastMessage.type === 'shared_post') {
      previewText = isSentByMe ? 'You shared a post' : 'Shared a post';
      previewIcon = 'image-outline';
    } else if (lastMessage.type === 'shared_reel') {
      previewText = isSentByMe ? 'You shared a reel' : 'Shared a reel';
      previewIcon = 'film-outline';
    } else if (lastMessage.story) {
      previewText = isSentByMe ? 'You replied to a story' : 'Replied to your story';
    } else if (typeof lastMessage.text === 'string' && lastMessage.text.trim()) {
      previewText = isSentByMe
        ? `You: ${lastMessage.text}`
        : lastMessage.text;
    } else {
      previewText = 'Message';
    }
  }

  /* =========================
     TIME TEXT
  ========================= */
  const timeText = lastMessage
    ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      {/* Avatar */}
      <Image
        source={{
          uri: otherUser?.profilePicture || 'https://via.placeholder.com/100',
        }}
        style={styles.avatar}
      />

      {/* Content */}
      <View style={styles.middle}>
        <View style={styles.topLine}>
          <Text style={styles.username} numberOfLines={1}>
            {otherUser?.username || 'User'}
          </Text>
          {!!timeText && <Text style={styles.time}>{timeText}</Text>}
        </View>

        <View style={styles.bottomLine}>
          {previewIcon && (
            <Ionicons
              name={previewIcon}
              size={14}
              color="#0095f6"
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.preview} numberOfLines={1}>
            {previewText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChatListItem;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: '#262626',
  },
  middle: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '75%',
  },
  time: {
    color: '#777',
    fontSize: 12,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  preview: {
    color: '#777',
    fontSize: 14,
    flex: 1,
  },
});