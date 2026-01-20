// import React from 'react';
// import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
// import colors from '../../theme/colors';

// const ChatListItem = ({ chat, currentUserId, onPress }) => {
//   // 1. Find the "Other" participant (The person you are talking to)
//   const otherUser = chat.participants.find(p => p._id !== currentUserId) || {};
  
//   // 2. Format Time (e.g., "10:30 AM" or "Yesterday")
//   const getLastMessageTime = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     // Simple check: is it today?
//     if (date.toDateString() === now.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     }
//     return date.toLocaleDateString();
//   };

//   return (
//     <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
//       {/* Avatar */}
//       <Image 
//         source={{ uri: otherUser.profilePicture || 'https://via.placeholder.com/50' }} 
//         style={styles.avatar} 
//       />
      
//       {/* Content */}
//       <View style={styles.content}>
//         <View style={styles.header}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser.username || "Unknown User"}
//           </Text>
//           <Text style={styles.time}>
//             {getLastMessageTime(chat.lastMessage?.createdAt)}
//           </Text>
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.message} numberOfLines={1}>
//             {chat.lastMessage?.content || "No messages yet"}
//           </Text>
//           {/* Optional: Unread Badge logic could go here */}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     padding: 15,
//     alignItems: 'center',
//     backgroundColor: colors.background,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0', // Very light divider
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//     backgroundColor: '#eee',
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   username: {
//     fontWeight: '600',
//     fontSize: 16,
//     color: colors.textPrimary,
//     flex: 1,
//   },
//   time: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   message: {
//     color: colors.textSecondary,
//     fontSize: 14,
//     flex: 1, // Ensures text truncates with ...
//   },
// });

// export default ChatListItem;



// import React from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
// } from 'react-native';
// import colors from '../../theme/colors';

// const ChatListItem = ({ chat, currentUserId, onPress }) => {
//   /* =========================
//      FIND OTHER USER
//   ========================= */
//   const otherUser =
//     chat.participants.find(p => p._id !== currentUserId) || {};

//   /* =========================
//      LAST MESSAGE PREVIEW
//   ========================= */
//   const getLastMessagePreview = () => {
//     const msg = chat.lastMessage;

//     if (!msg) return 'No messages yet';

//     // Deleted for everyone
//     if (msg.deletedForEveryone) {
//       return 'Message deleted';
//     }

//     // Encrypted message (E2EE)
//     if (msg.cipherText) {
//       return '🔒 Encrypted message';
//     }

//     // Fallback (should not normally happen)
//     return 'No messages yet';
//   };

//   /* =========================
//      FORMAT TIME
//   ========================= */
//   const getLastMessageTime = dateString => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();

//     if (date.toDateString() === now.toDateString()) {
//       return date.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });
//     }

//     return date.toLocaleDateString();
//   };

//   return (
//     <TouchableOpacity
//       style={styles.container}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       {/* AVATAR */}
//       <Image
//         source={{
//           uri:
//             otherUser.profilePicture ||
//             'https://via.placeholder.com/50',
//         }}
//         style={styles.avatar}
//       />

//       {/* CONTENT */}
//       <View style={styles.content}>
//         <View style={styles.header}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser.username || 'Unknown User'}
//           </Text>

//           <Text style={styles.time}>
//             {getLastMessageTime(chat.lastMessage?.createdAt)}
//           </Text>
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.message} numberOfLines={1}>
//             {getLastMessagePreview()}
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
//   container: {
//     flexDirection: 'row',
//     padding: 15,
//     alignItems: 'center',
//     backgroundColor: colors.background,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//     backgroundColor: '#eee',
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   username: {
//     fontWeight: '600',
//     fontSize: 16,
//     color: colors.textPrimary,
//     flex: 1,
//   },
//   time: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   footer: {
//     flexDirection: 'row',
//   },
//   message: {
//     color: colors.textSecondary,
//     fontSize: 14,
//     flex: 1,
//   },
// });






// import React from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
// } from 'react-native';
// import colors from '../../theme/colors';

// const ChatListItem = ({ chat, currentUserId, onPress }) => {
//   const otherUser =
//     chat.participants.find(p => p._id !== currentUserId) || {};

//   /* =========================
//      LAST MESSAGE LABEL
//   ========================= */
//   const getLastMessageLabel = () => {
//     const msg = chat.lastMessage;
//     if (!msg) return 'No messages yet';

//     if (msg.deletedForEveryone) {
//       return 'Message deleted';
//     }

//     // Sent vs Received
//     if (
//       typeof msg.sender === 'string'
//         ? msg.sender === currentUserId
//         : msg.sender?._id === currentUserId
//     ) {
//       return 'Sent';
//     }

//     return 'Received';
//   };

//   /* =========================
//      TIME
//   ========================= */
//   const getLastMessageTime = dateString => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();

//     if (date.toDateString() === now.toDateString()) {
//       return date.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });
//     }
//     return date.toLocaleDateString();
//   };

//   return (
//     <TouchableOpacity
//       style={styles.container}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       {/* AVATAR */}
//       <Image
//         source={{
//           uri:
//             otherUser.profilePicture ||
//             'https://via.placeholder.com/50',
//         }}
//         style={styles.avatar}
//       />

//       {/* CONTENT */}
//       <View style={styles.content}>
//         <View style={styles.header}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser.username || 'Unknown'}
//           </Text>

//           <Text style={styles.time}>
//             {getLastMessageTime(chat.lastMessage?.createdAt)}
//           </Text>
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.message} numberOfLines={1}>
//             {getLastMessageLabel()}
//           </Text>

//           {/* 🔴 UNREAD BADGE */}
//           {chat.unreadCount > 0 && (
//             <View style={styles.badge}>
//               <Text style={styles.badgeText}>
//                 {chat.unreadCount}
//               </Text>
//             </View>
//           )}
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
//   container: {
//     flexDirection: 'row',
//     padding: 15,
//     alignItems: 'center',
//     backgroundColor: colors.background,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//     backgroundColor: '#eee',
//   },
//   content: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   username: {
//     fontWeight: '600',
//     fontSize: 16,
//     color: colors.textPrimary,
//     flex: 1,
//   },
//   time: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   message: {
//     color: colors.textSecondary,
//     fontSize: 14,
//     flex: 1,
//   },
//   badge: {
//     backgroundColor: '#FF3B30',
//     minWidth: 18,
//     height: 18,
//     borderRadius: 9,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 8,
//     paddingHorizontal: 5,
//   },
//   badgeText: {
//     color: 'white',
//     fontSize: 11,
//     fontWeight: 'bold',
//   },
// });





// import React from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
// } from 'react-native';
// import colors from '../../theme/colors';

// const ChatListItem = ({ chat, currentUserId, onPress }) => {
//   const otherUser =
//     chat.participants.find(p => p._id !== currentUserId) || {};

//   /* =========================
//      LAST MESSAGE PREVIEW
//   ========================= */
//   const getLastMessagePreview = () => {
//     const msg = chat.lastMessage;

//     if (!msg) return 'No messages yet';

//     if (msg.deletedForEveryone) {
//       return 'Message deleted';
//     }

//     const senderId =
//       typeof msg.sender === 'string'
//         ? msg.sender
//         : msg.sender?._id;

//     if (!senderId) return 'Message';

//     return senderId === currentUserId ? 'Sent' : 'Received';
//   };

//   const getLastMessageTime = dateString => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();

//     if (date.toDateString() === now.toDateString()) {
//       return date.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });
//     }

//     return date.toLocaleDateString();
//   };

//   return (
//     <TouchableOpacity
//       style={styles.container}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       <Image
//         source={{
//           uri:
//             otherUser.profilePicture ||
//             'https://via.placeholder.com/50',
//         }}
//         style={styles.avatar}
//       />

//       <View style={styles.content}>
//         <View style={styles.header}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser.username || 'Unknown User'}
//           </Text>

//           <Text style={styles.time}>
//             {getLastMessageTime(chat.lastMessage?.createdAt)}
//           </Text>
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.message} numberOfLines={1}>
//             {getLastMessagePreview()}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// export default ChatListItem;

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     padding: 15,
//     alignItems: 'center',
//     backgroundColor: colors.background,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//     backgroundColor: '#eee',
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   username: {
//     fontWeight: '600',
//     fontSize: 16,
//     color: colors.textPrimary,
//     flex: 1,
//   },
//   time: {
//     fontSize: 12,
//     color: colors.textSecondary,
//   },
//   footer: {
//     flexDirection: 'row',
//   },
//   message: {
//     color: colors.textSecondary,
//     fontSize: 14,
//     flex: 1,
//   },
// });



// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const ChatListItem = ({
//   chat,
//   otherUser,
//   currentUserId,
//   onPress,
// }) => {
//   const lastMessage = chat.lastMessage;
//   const isUnread = chat.unreadCount > 0;

//   const lastText = lastMessage
//     ? lastMessage.type === 'reel_share'
//       ? 'Sent a reel'
//       : lastMessage.type === 'image'
//       ? 'Sent a photo'
//       : 'Message'
//     : 'Start chatting';

//   const timeText = lastMessage
//     ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       })
//     : '';

//   return (
//     <TouchableOpacity
//       style={styles.row}
//       activeOpacity={0.7}
//       onPress={onPress}
//     >
//       {/* AVATAR */}
//       <Image
//         source={{
//           uri:
//             otherUser.profilePicture ||
//             'https://via.placeholder.com/100',
//         }}
//         style={styles.avatar}
//       />

//       {/* TEXT */}
//       <View style={styles.middle}>
//         <View style={styles.topLine}>
//           <Text style={styles.username} numberOfLines={1}>
//             {otherUser.username}
//           </Text>

//           {!!timeText && (
//             <Text style={styles.time}>{timeText}</Text>
//           )}
//         </View>

//         <View style={styles.bottomLine}>
//           <Text
//             style={[
//               styles.preview,
//               isUnread && styles.unreadPreview,
//             ]}
//             numberOfLines={1}
//           >
//             {lastText}
//           </Text>

//           {isUnread && <View style={styles.dot} />}
//         </View>
//       </View>

//       {/* CAMERA */}
//       <Ionicons
//         name="camera-outline"
//         size={22}
//         color="#888"
//         style={styles.camera}
//       />
//     </TouchableOpacity>
//   );
// };

// export default ChatListItem;

// /* =========================
//    STYLES (Instagram-accurate)
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
//   },
//   middle: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   topLine: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
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
//     flexShrink: 1,
//   },
//   unreadPreview: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#3797F0',
//     marginLeft: 8,
//   },
//   camera: {
//     marginLeft: 10,
//   },
// });




import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatListItem = ({
  chat,
  otherUser,
  currentUserId,
  onPress,
}) => {
  const lastMessage = chat.lastMessage;

  const isUnread = chat.unreadCount > 0;

  const isSentByMe =
    lastMessage &&
    (typeof lastMessage.sender === 'string'
      ? lastMessage.sender === currentUserId
      : lastMessage.sender?._id === currentUserId);

  let previewText = 'Start chat';

  if (lastMessage) {
    previewText = isSentByMe ? 'Sent' : 'Received';
  }

  const timeText = lastMessage
    ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* AVATAR */}
      <Image
        source={{
          uri:
            otherUser.profilePicture ||
            'https://via.placeholder.com/100',
        }}
        style={styles.avatar}
      />

      {/* TEXT */}
      <View style={styles.middle}>
        <View style={styles.topLine}>
          <Text style={styles.username} numberOfLines={1}>
            {otherUser.username}
          </Text>

          {!!timeText && (
            <Text style={styles.time}>{timeText}</Text>
          )}
        </View>

        <View style={styles.bottomLine}>
          <Text
            style={[
              styles.preview,
              isUnread && !isSentByMe && styles.unreadPreview,
            ]}
            numberOfLines={1}
          >
            {previewText}
          </Text>

          {isUnread && !isSentByMe && (
            <View style={styles.dot} />
          )}
        </View>
      </View>

      {/* CAMERA */}
      <Ionicons
        name="camera-outline"
        size={22}
        color="#888"
        style={styles.camera}
      />
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
  },
  unreadPreview: {
    color: '#fff',
    fontWeight: '500',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3797F0',
    marginLeft: 8,
  },
  camera: {
    marginLeft: 10,
  },
});
