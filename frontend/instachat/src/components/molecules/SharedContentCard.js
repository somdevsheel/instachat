// import React from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { ROUTES } from '../../navigation/routes.constants';

// const CARD_WIDTH = Dimensions.get('window').width * 0.6;

// /**
//  * ======================================================
//  * SHARED CONTENT CARD
//  * ======================================================
//  * Renders a shared post or reel inside a MessageBubble.
//  *
//  * Usage:
//  *   <SharedContentCard
//  *     type="shared_post"
//  *     post={message.sharedPost}      // for posts
//  *     reel={message.sharedReel}      // for reels
//  *     isOwnMessage={true}
//  *   />
//  */
// export default function SharedContentCard({ type, post, reel, isOwnMessage }) {
//   const navigation = useNavigation();

//   const handlePress = () => {
//     if (type === 'shared_post' && post?._id) {
//       navigation.navigate(ROUTES.POST_DETAIL || 'PostDetail', {
//         postId: post._id,
//       });
//     } else if (type === 'shared_reel' && reel?._id) {
//       navigation.navigate(ROUTES.REELS || 'Reels', {
//         reelId: reel._id,
//       });
//     }
//   };

//   /* =========================
//      SHARED POST
//   ========================= */
//   if (type === 'shared_post' && post) {
//     const imageUrl =
//       post.media?.variants?.thumbnail ||
//       post.media?.variants?.original;
//     const isVideo = post.media?.type === 'video';

//     return (
//       <TouchableOpacity
//         style={[styles.card, isOwnMessage ? styles.cardOwn : styles.cardOther]}
//         onPress={handlePress}
//         activeOpacity={0.8}
//       >
//         {/* Image */}
//         {imageUrl && (
//           <View style={styles.imageContainer}>
//             <Image source={{ uri: imageUrl }} style={styles.image} />
//             {isVideo && (
//               <View style={styles.playBadge}>
//                 <Ionicons name="play" size={14} color="#fff" />
//               </View>
//             )}
//           </View>
//         )}

//         {/* Info */}
//         <View style={styles.info}>
//           <View style={styles.userRow}>
//             {post.user?.profilePicture && (
//               <Image
//                 source={{ uri: post.user.profilePicture }}
//                 style={styles.miniAvatar}
//               />
//             )}
//             <Text style={styles.username} numberOfLines={1}>
//               {post.user?.username || 'User'}
//             </Text>
//           </View>

//           {!!post.caption && (
//             <Text style={styles.caption} numberOfLines={2}>
//               {post.caption}
//             </Text>
//           )}

//           <View style={styles.statsRow}>
//             <Ionicons name="heart" size={12} color="#888" />
//             <Text style={styles.statText}>{post.likesCount || 0}</Text>
//             <Ionicons name="chatbubble" size={12} color="#888" style={{ marginLeft: 8 }} />
//             <Text style={styles.statText}>{post.commentsCount || 0}</Text>
//           </View>
//         </View>

//         {/* Label */}
//         <View style={styles.labelRow}>
//           <Ionicons name="image-outline" size={12} color="#0095f6" />
//           <Text style={styles.labelText}>Post</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   }

//   /* =========================
//      SHARED REEL
//   ========================= */
//   if (type === 'shared_reel' && reel) {
//     const thumbnail = reel.thumbnailUrl;

//     return (
//       <TouchableOpacity
//         style={[styles.card, isOwnMessage ? styles.cardOwn : styles.cardOther]}
//         onPress={handlePress}
//         activeOpacity={0.8}
//       >
//         {/* Thumbnail */}
//         <View style={styles.reelThumbContainer}>
//           {thumbnail ? (
//             <Image source={{ uri: thumbnail }} style={styles.reelThumb} />
//           ) : (
//             <View style={[styles.reelThumb, styles.reelPlaceholder]}>
//               <Ionicons name="film-outline" size={28} color="#555" />
//             </View>
//           )}
//           <View style={styles.playBadge}>
//             <Ionicons name="play" size={16} color="#fff" />
//           </View>
//         </View>

//         {/* Info */}
//         <View style={styles.info}>
//           <View style={styles.userRow}>
//             {reel.user?.profilePicture && (
//               <Image
//                 source={{ uri: reel.user.profilePicture }}
//                 style={styles.miniAvatar}
//               />
//             )}
//             <Text style={styles.username} numberOfLines={1}>
//               {reel.user?.username || 'User'}
//             </Text>
//           </View>

//           {!!reel.caption && (
//             <Text style={styles.caption} numberOfLines={2}>
//               {reel.caption}
//             </Text>
//           )}

//           <View style={styles.statsRow}>
//             <Ionicons name="eye" size={12} color="#888" />
//             <Text style={styles.statText}>{reel.viewsCount || 0}</Text>
//             <Ionicons name="heart" size={12} color="#888" style={{ marginLeft: 8 }} />
//             <Text style={styles.statText}>{reel.likesCount || 0}</Text>
//           </View>
//         </View>

//         {/* Label */}
//         <View style={styles.labelRow}>
//           <Ionicons name="film-outline" size={12} color="#0095f6" />
//           <Text style={styles.labelText}>Reel</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   }

//   // Fallback: content was deleted
//   return (
//     <View style={[styles.card, styles.deletedCard]}>
//       <Ionicons name="alert-circle-outline" size={20} color="#666" />
//       <Text style={styles.deletedText}>Content unavailable</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     width: CARD_WIDTH,
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginVertical: 2,
//   },
//   cardOwn: {
//     backgroundColor: '#1a1a2e',
//     borderWidth: 1,
//     borderColor: '#0095f6' + '30',
//   },
//   cardOther: {
//     backgroundColor: '#1e1e1e',
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   imageContainer: {
//     width: '100%',
//     height: CARD_WIDTH * 0.8,
//     backgroundColor: '#000',
//     position: 'relative',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   reelThumbContainer: {
//     width: '100%',
//     height: CARD_WIDTH * 1.1,
//     backgroundColor: '#000',
//     position: 'relative',
//   },
//   reelThumb: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   reelPlaceholder: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1a1a1a',
//   },
//   playBadge: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginTop: -16,
//     marginLeft: -16,
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingLeft: 2,
//   },
//   info: {
//     padding: 10,
//   },
//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 4,
//   },
//   miniAvatar: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: '#333',
//   },
//   username: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//     flex: 1,
//   },
//   caption: {
//     color: '#ccc',
//     fontSize: 12,
//     lineHeight: 16,
//     marginBottom: 6,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 3,
//   },
//   statText: {
//     color: '#888',
//     fontSize: 11,
//   },
//   labelRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingBottom: 8,
//   },
//   labelText: {
//     color: '#0095f6',
//     fontSize: 11,
//     fontWeight: '600',
//   },
//   deletedCard: {
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: '#1a1a1a',
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   deletedText: {
//     color: '#666',
//     fontSize: 13,
//   },
// });












// import React from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { ROUTES } from '../../navigation/routes.constants';

// const CARD_WIDTH = Dimensions.get('window').width * 0.6;

// /**
//  * ======================================================
//  * SHARED CONTENT CARD
//  * ======================================================
//  * Renders a shared post or reel inside a MessageBubble.
//  *
//  * Usage:
//  *   <SharedContentCard
//  *     type="shared_post"
//  *     post={message.sharedPost}      // for posts
//  *     reel={message.sharedReel}      // for reels
//  *     isOwnMessage={true}
//  *   />
//  */
// export default function SharedContentCard({ type, post, reel, isOwnMessage }) {
//   const navigation = useNavigation();

//   const handlePress = () => {
//     if (type === 'shared_post' && post?._id) {
//       navigation.navigate(ROUTES.POST_DETAIL, {
//         postId: post._id,
//       });
//     } else if (type === 'shared_reel' && reel?._id) {
//       // Navigate to Reels tab with the specific reel
//       navigation.navigate(ROUTES.MAIN_TAB, {
//         screen: ROUTES.REELS,
//         params: { scrollToReelId: reel._id },
//       });
//     }
//   };

//   /* =========================
//      SHARED POST
//   ========================= */
//   if (type === 'shared_post' && post) {
//     const imageUrl =
//       post.media?.variants?.thumbnail ||
//       post.media?.variants?.original;
//     const isVideo = post.media?.type === 'video';

//     return (
//       <TouchableOpacity
//         style={[styles.card, isOwnMessage ? styles.cardOwn : styles.cardOther]}
//         onPress={handlePress}
//         activeOpacity={0.8}
//       >
//         {/* Image */}
//         {imageUrl && (
//           <View style={styles.imageContainer}>
//             <Image source={{ uri: imageUrl }} style={styles.image} />
//             {isVideo && (
//               <View style={styles.playBadge}>
//                 <Ionicons name="play" size={14} color="#fff" />
//               </View>
//             )}
//           </View>
//         )}

//         {/* Info */}
//         <View style={styles.info}>
//           <View style={styles.userRow}>
//             {post.user?.profilePicture && (
//               <Image
//                 source={{ uri: post.user.profilePicture }}
//                 style={styles.miniAvatar}
//               />
//             )}
//             <Text style={styles.username} numberOfLines={1}>
//               {post.user?.username || 'User'}
//             </Text>
//           </View>

//           {!!post.caption && (
//             <Text style={styles.caption} numberOfLines={2}>
//               {post.caption}
//             </Text>
//           )}

//           <View style={styles.statsRow}>
//             <Ionicons name="heart" size={12} color="#888" />
//             <Text style={styles.statText}>{post.likesCount || 0}</Text>
//             <Ionicons name="chatbubble" size={12} color="#888" style={{ marginLeft: 8 }} />
//             <Text style={styles.statText}>{post.commentsCount || 0}</Text>
//           </View>
//         </View>

//         {/* Label */}
//         <View style={styles.labelRow}>
//           <Ionicons name="image-outline" size={12} color="#0095f6" />
//           <Text style={styles.labelText}>Post</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   }

//   /* =========================
//      SHARED REEL
//   ========================= */
//   if (type === 'shared_reel' && reel) {
//     const thumbnail = reel.thumbnailUrl || reel.videoUrl;

//     return (
//       <TouchableOpacity
//         style={[styles.card, isOwnMessage ? styles.cardOwn : styles.cardOther]}
//         onPress={handlePress}
//         activeOpacity={0.8}
//       >
//         {/* Thumbnail */}
//         <View style={styles.reelThumbContainer}>
//           {thumbnail ? (
//             <Image source={{ uri: thumbnail }} style={styles.reelThumb} />
//           ) : (
//             <View style={[styles.reelThumb, styles.reelPlaceholder]}>
//               <Ionicons name="film-outline" size={28} color="#555" />
//             </View>
//           )}
//           <View style={styles.playBadge}>
//             <Ionicons name="play" size={16} color="#fff" />
//           </View>
//         </View>

//         {/* Info */}
//         <View style={styles.info}>
//           <View style={styles.userRow}>
//             {reel.user?.profilePicture && (
//               <Image
//                 source={{ uri: reel.user.profilePicture }}
//                 style={styles.miniAvatar}
//               />
//             )}
//             <Text style={styles.username} numberOfLines={1}>
//               {reel.user?.username || 'User'}
//             </Text>
//           </View>

//           {!!reel.caption && (
//             <Text style={styles.caption} numberOfLines={2}>
//               {reel.caption}
//             </Text>
//           )}

//           <View style={styles.statsRow}>
//             <Ionicons name="eye" size={12} color="#888" />
//             <Text style={styles.statText}>{reel.viewsCount || 0}</Text>
//             <Ionicons name="heart" size={12} color="#888" style={{ marginLeft: 8 }} />
//             <Text style={styles.statText}>{reel.likesCount || 0}</Text>
//           </View>
//         </View>

//         {/* Label */}
//         <View style={styles.labelRow}>
//           <Ionicons name="film-outline" size={12} color="#0095f6" />
//           <Text style={styles.labelText}>Reel</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   }

//   // Fallback: content was deleted
//   return (
//     <View style={[styles.card, styles.deletedCard]}>
//       <Ionicons name="alert-circle-outline" size={20} color="#666" />
//       <Text style={styles.deletedText}>Content unavailable</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     width: CARD_WIDTH,
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginVertical: 2,
//   },
//   cardOwn: {
//     backgroundColor: '#1a1a2e',
//     borderWidth: 1,
//     borderColor: '#0095f6' + '30',
//   },
//   cardOther: {
//     backgroundColor: '#1e1e1e',
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   imageContainer: {
//     width: '100%',
//     height: CARD_WIDTH * 0.8,
//     backgroundColor: '#000',
//     position: 'relative',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   reelThumbContainer: {
//     width: '100%',
//     height: CARD_WIDTH * 1.1,
//     backgroundColor: '#000',
//     position: 'relative',
//   },
//   reelThumb: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   reelPlaceholder: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1a1a1a',
//   },
//   playBadge: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginTop: -16,
//     marginLeft: -16,
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingLeft: 2,
//   },
//   info: {
//     padding: 10,
//   },
//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 4,
//   },
//   miniAvatar: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: '#333',
//   },
//   username: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//     flex: 1,
//   },
//   caption: {
//     color: '#ccc',
//     fontSize: 12,
//     lineHeight: 16,
//     marginBottom: 6,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 3,
//   },
//   statText: {
//     color: '#888',
//     fontSize: 11,
//   },
//   labelRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingBottom: 8,
//   },
//   labelText: {
//     color: '#0095f6',
//     fontSize: 11,
//     fontWeight: '600',
//   },
//   deletedCard: {
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: '#1a1a1a',
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   deletedText: {
//     color: '#666',
//     fontSize: 13,
//   },
// });





import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../navigation/routes.constants';

const CARD_WIDTH = Dimensions.get('window').width * 0.6;

/**
 * ======================================================
 * SHARED CONTENT CARD
 * ======================================================
 * Renders a shared post or reel inside a MessageBubble.
 *
 * Usage:
 *   <SharedContentCard
 *     type="shared_post"
 *     post={message.sharedPost}      // for posts
 *     reel={message.sharedReel}      // for reels
 *     isOwnMessage={true}
 *   />
 */
export default function SharedContentCard({ type, post, reel, isOwnMessage }) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (type === 'shared_post' && post?._id) {
      navigation.navigate(ROUTES.POST_DETAIL, {
        postId: post._id,
      });
    } else if (type === 'shared_reel' && reel?._id) {
      navigation.navigate(ROUTES.REEL_DETAIL, {
        reelId: reel._id,
      });
    }
  };

  /* =========================
     SHARED POST
  ========================= */
  if (type === 'shared_post' && post) {
    const imageUrl =
      post.media?.variants?.thumbnail ||
      post.media?.variants?.original;
    const isVideo = post.media?.type === 'video';

    return (
      <TouchableOpacity
        style={[styles.card, isOwnMessage ? styles.cardOwn : styles.cardOther]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Image */}
        {imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            {isVideo && (
              <View style={styles.playBadge}>
                <Ionicons name="play" size={14} color="#fff" />
              </View>
            )}
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.userRow}>
            {post.user?.profilePicture && (
              <Image
                source={{ uri: post.user.profilePicture }}
                style={styles.miniAvatar}
              />
            )}
            <Text style={styles.username} numberOfLines={1}>
              {post.user?.username || 'User'}
            </Text>
          </View>

          {!!post.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {post.caption}
            </Text>
          )}

          <View style={styles.statsRow}>
            <Ionicons name="heart" size={12} color="#888" />
            <Text style={styles.statText}>{post.likesCount || 0}</Text>
            <Ionicons name="chatbubble" size={12} color="#888" style={{ marginLeft: 8 }} />
            <Text style={styles.statText}>{post.commentsCount || 0}</Text>
          </View>
        </View>

        {/* Label */}
        <View style={styles.labelRow}>
          <Ionicons name="image-outline" size={12} color="#0095f6" />
          <Text style={styles.labelText}>Post</Text>
        </View>
      </TouchableOpacity>
    );
  }

  /* =========================
     SHARED REEL
  ========================= */
  if (type === 'shared_reel' && reel) {
    const thumbnail = reel.thumbnailUrl || reel.videoUrl;

    return (
      <TouchableOpacity
        style={[styles.card, isOwnMessage ? styles.cardOwn : styles.cardOther]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Thumbnail */}
        <View style={styles.reelThumbContainer}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.reelThumb} />
          ) : (
            <View style={[styles.reelThumb, styles.reelPlaceholder]}>
              <Ionicons name="film-outline" size={28} color="#555" />
            </View>
          )}
          <View style={styles.playBadge}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.userRow}>
            {reel.user?.profilePicture && (
              <Image
                source={{ uri: reel.user.profilePicture }}
                style={styles.miniAvatar}
              />
            )}
            <Text style={styles.username} numberOfLines={1}>
              {reel.user?.username || 'User'}
            </Text>
          </View>

          {!!reel.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {reel.caption}
            </Text>
          )}

          <View style={styles.statsRow}>
            <Ionicons name="eye" size={12} color="#888" />
            <Text style={styles.statText}>{reel.viewsCount || 0}</Text>
            <Ionicons name="heart" size={12} color="#888" style={{ marginLeft: 8 }} />
            <Text style={styles.statText}>{reel.likesCount || 0}</Text>
          </View>
        </View>

        {/* Label */}
        <View style={styles.labelRow}>
          <Ionicons name="film-outline" size={12} color="#0095f6" />
          <Text style={styles.labelText}>Reel</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Fallback: content was deleted
  return (
    <View style={[styles.card, styles.deletedCard]}>
      <Ionicons name="alert-circle-outline" size={20} color="#666" />
      <Text style={styles.deletedText}>Content unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 2,
  },
  cardOwn: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#0095f6' + '30',
  },
  cardOther: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reelThumbContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    backgroundColor: '#000',
    position: 'relative',
  },
  reelThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reelPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  info: {
    padding: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#333',
  },
  username: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  caption: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: '#888',
    fontSize: 11,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  labelText: {
    color: '#0095f6',
    fontSize: 11,
    fontWeight: '600',
  },
  deletedCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  deletedText: {
    color: '#666',
    fontSize: 13,
  },
});