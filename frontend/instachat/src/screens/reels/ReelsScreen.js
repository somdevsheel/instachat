// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
// } from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import { useFocusEffect } from '@react-navigation/native';
// import { getFeed } from '../../api/Posts.api';
// import colors from '../../theme/colors';

// const { height, width } = Dimensions.get('window');

// const ReelsScreen = () => {
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useFocusEffect(
//     useCallback(() => {
//       fetchReels();
//     }, [])
//   );

//   const fetchReels = async () => {
//     try {
//       const data = await getFeed();
//       // backend returns { success, data }
//       setReels(data.data || []);
//     } catch (e) {
//       console.error('❌ Error fetching reels:', e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <View style={styles.reelContainer}>
//       <Video
//         source={{ uri: item.videoUrl }}
//         style={styles.video}
//         resizeMode={ResizeMode.COVER}
//         shouldPlay
//         isLooping
//         isMuted={false}
//       />

//       {/* Overlay */}
//       <View style={styles.overlay}>
//         <View style={styles.userInfo}>
//           <Image
//             source={{
//               uri:
//                 item.uploader?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.username}>
//             @{item.uploader?.username || 'user'}
//           </Text>
//         </View>
//         <Text style={styles.caption}>{item.caption}</Text>
//       </View>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
//   }

//   if (reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: 'white' }}>
//           No Reels yet. Upload one!
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={item => item._id}
//         pagingEnabled
//         showsVerticalScrollIndicator={false}
//         snapToInterval={height}
//         snapToAlignment="start"
//         decelerationRate="fast"
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'black' },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'black',
//   },
//   reelContainer: {
//     width,
//     height,
//     position: 'relative',
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     position: 'absolute',
//     bottom: 100,
//     left: 20,
//     right: 20,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     marginRight: 10,
//   },
//   username: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   caption: {
//     color: 'white',
//     fontSize: 14,
//   },
// });

// export default ReelsScreen;



// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
//   StatusBar,
// } from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import { useFocusEffect, useNavigation } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';
// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// /**
//  * ======================================================
//  * SINGLE REEL ITEM COMPONENT
//  * ======================================================
//  */
// const ReelItem = ({
//   item,
//   isActive,
//   onLike,
//   onDoubleTap,
//   onSingleTap,
//   onUserPress,
//   onCommentPress,
//   onSharePress,
// }) => {
//   const videoRef = useRef(null);
//   const [isPaused, setIsPaused] = useState(false);
//   const [isBuffering, setIsBuffering] = useState(true);
//   const heartScale = useRef(new Animated.Value(0)).current;
//   const lastTap = useRef(0);

//   /* =========================
//      PLAY/PAUSE BASED ON VISIBILITY
//   ========================= */
//   useEffect(() => {
//     if (videoRef.current) {
//       if (isActive && !isPaused) {
//         videoRef.current.playAsync();
//       } else {
//         videoRef.current.pauseAsync();
//       }
//     }
//   }, [isActive, isPaused]);

//   /* =========================
//      HANDLE TAP (SINGLE/DOUBLE)
//   ========================= */
//   const handleTap = () => {
//     const now = Date.now();
//     const DOUBLE_TAP_DELAY = 300;

//     if (now - lastTap.current < DOUBLE_TAP_DELAY) {
//       // Double tap - Like
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       // Single tap - Pause/Play
//       lastTap.current = now;
//       setTimeout(() => {
//         if (lastTap.current !== 0 && Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
//           handleSingleTap();
//         }
//       }, DOUBLE_TAP_DELAY);
//     }
//   };

//   const handleSingleTap = () => {
//     setIsPaused((prev) => !prev);
//     onSingleTap?.();
//   };

//   const handleDoubleTap = () => {
//     // Animate heart
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         friction: 3,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Only like if not already liked
//     if (!item.isLiked) {
//       onLike(item._id);
//     }
    
//     onDoubleTap?.();
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = (status) => {
//     if (status.isLoaded) {
//       setIsBuffering(status.isBuffering);
//     }
//     if (status.error) {
//       console.error('❌ Video playback error:', status.error);
//     }
//   };

//   /* =========================
//      VIDEO LOAD ERROR
//   ========================= */
//   const onVideoError = (error) => {
//     console.error('❌ Video load error:', error);
//     console.log('🎬 Failed video URL:', item.videoUrl);
//   };

//   /* =========================
//      VIDEO READY
//   ========================= */
//   const onVideoLoad = (status) => {
//     console.log('✅ Video loaded:', item._id, status.durationMillis);
//     setIsBuffering(false);
//   };

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             shouldPlay={isActive && !isPaused}
//             isLooping
//             isMuted={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onError={onVideoError}
//             onLoad={onVideoLoad}
//           />

//           {/* Buffering Indicator */}
//           {isBuffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {/* Paused Indicator */}
//           {isPaused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
//             </View>
//           )}

//           {/* Double Tap Heart Animation */}
//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* Right Side Actions */}
//       <View style={styles.actionsContainer}>
//         {/* Like */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={30}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         {/* Comment */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="chatbubble-outline" size={28} color="#fff" />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         {/* Share */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="paper-plane-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         {/* More Options */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
//         </TouchableOpacity>

//         {/* User Avatar */}
//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//           activeOpacity={0.7}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* Bottom Overlay - User Info & Caption */}
//       <View style={styles.bottomOverlay}>
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//           activeOpacity={0.7}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>
//           <TouchableOpacity style={styles.followButton}>
//             <Text style={styles.followText}>Follow</Text>
//           </TouchableOpacity>
//         </TouchableOpacity>

//         {item.caption ? (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         ) : null}

//         {/* Audio/Music Row */}
//         <View style={styles.audioRow}>
//           <Ionicons name="musical-notes" size={14} color="#fff" />
//           <Text style={styles.audioText} numberOfLines={1}>
//             {item.audioName || 'Original Audio'}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// /**
//  * ======================================================
//  * FORMAT NUMBERS (1K, 1M, etc.)
//  * ======================================================
//  */
// const formatCount = (count) => {
//   if (!count || count === 0) return '0';
//   if (count >= 1000000) {
//     return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }
//   if (count >= 1000) {
//     return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
//   }
//   return count.toString();
// };

// /**
//  * ======================================================
//  * MAIN REELS SCREEN
//  * ======================================================
//  */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const { reels, loading, refreshing, error, currentIndex, pagination } =
//     useSelector((state) => state.reels);

//   const [visibleIndex, setVisibleIndex] = useState(0);
//   const viewedReels = useRef(new Set());

//   /* =========================
//      LOAD REELS ON FOCUS
//   ========================= */
//   useFocusEffect(
//     useCallback(() => {
//       console.log('🎬 ReelsScreen focused, fetching reels...');
//       dispatch(fetchReels({ page: 1 }));
      
//       // Hide status bar for immersive experience
//       StatusBar.setHidden(true);

//       return () => {
//         StatusBar.setHidden(false);
//       };
//     }, [dispatch])
//   );

//   /* =========================
//      DEBUG: Log reels data
//   ========================= */
//   useEffect(() => {
//     console.log('🎬 Reels state:', {
//       count: reels.length,
//       loading,
//       error,
//       firstReel: reels[0] ? {
//         id: reels[0]._id,
//         videoUrl: reels[0].videoUrl,
//         user: reels[0].user?.username,
//       } : null,
//     });
//   }, [reels, loading, error]);

//   /* =========================
//      TRACK VIEW COUNT
//   ========================= */
//   useEffect(() => {
//     if (reels.length > 0 && visibleIndex >= 0) {
//       const currentReel = reels[visibleIndex];
//       if (currentReel && !viewedReels.current.has(currentReel._id)) {
//         viewedReels.current.add(currentReel._id);
//         dispatch(trackReelView(currentReel._id));
//       }
//     }
//   }, [visibleIndex, reels, dispatch]);

//   /* =========================
//      VISIBILITY CONFIG
//   ========================= */
//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 50,
//   }).current;

//   const onViewableItemsChanged = useRef(({ viewableItems }) => {
//     if (viewableItems.length > 0) {
//       const index = viewableItems[0].index;
//       setVisibleIndex(index);
//       dispatch(setCurrentIndex(index));
//     }
//   }).current;

//   /* =========================
//      HANDLERS
//   ========================= */
//   const handleLike = useCallback(
//     (reelId) => {
//       dispatch(toggleReelLike(reelId));
//     },
//     [dispatch]
//   );

//   const handleUserPress = useCallback(
//     (user) => {
//       if (user?._id) {
//         navigation.navigate(ROUTES.USER_PROFILE, { userId: user._id });
//       }
//     },
//     [navigation]
//   );

//   const handleCommentPress = useCallback(
//     (reelId) => {
//       navigation.navigate(ROUTES.COMMENTS, {
//         postId: reelId,
//         type: 'reel',
//       });
//     },
//     [navigation]
//   );

//   const handleSharePress = useCallback((reel) => {
//     // TODO: Implement share functionality
//     console.log('Share reel:', reel._id);
//   }, []);

//   const handleRefresh = useCallback(() => {
//     dispatch(fetchReels({ page: 1 }));
//   }, [dispatch]);

//   const handleLoadMore = useCallback(() => {
//     if (!refreshing && pagination.page < pagination.totalPages) {
//       dispatch(fetchReels({ page: pagination.page + 1 }));
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* =========================
//      RENDER ITEM
//   ========================= */
//   const renderItem = useCallback(
//     ({ item, index }) => (
//       <ReelItem
//         item={item}
//         isActive={index === visibleIndex}
//         onLike={handleLike}
//         onUserPress={handleUserPress}
//         onCommentPress={handleCommentPress}
//         onSharePress={handleSharePress}
//       />
//     ),
//     [visibleIndex, handleLike, handleUserPress, handleCommentPress, handleSharePress]
//   );

//   const keyExtractor = useCallback((item) => item._id, []);

//   const getItemLayout = useCallback(
//     (data, index) => ({
//       length: SCREEN_HEIGHT,
//       offset: SCREEN_HEIGHT * index,
//       index,
//     }),
//     []
//   );

//   /* =========================
//      LOADING STATE
//   ========================= */
//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
//   }

//   /* =========================
//      EMPTY STATE
//   ========================= */
//   if (!loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="videocam-outline" size={60} color="#555" />
//         <Text style={styles.emptyText}>No Reels yet</Text>
//         <TouchableOpacity
//           style={styles.uploadButton}
//           onPress={() => navigation.navigate(ROUTES.UPLOAD_REEL)}
//         >
//           <Text style={styles.uploadButtonText}>Create a Reel</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   /* =========================
//      MAIN RENDER
//   ========================= */
//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//         <Text style={styles.headerTitle}>Reels</Text>
//         <TouchableOpacity
//           onPress={() => navigation.navigate(ROUTES.UPLOAD_REEL)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         pagingEnabled
//         showsVerticalScrollIndicator={false}
//         snapToInterval={SCREEN_HEIGHT}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewabilityConfig}
//         getItemLayout={getItemLayout}
//         onRefresh={handleRefresh}
//         refreshing={refreshing}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={Platform.OS === 'android'}
//         maxToRenderPerBatch={3}
//         windowSize={5}
//         initialNumToRender={2}
//       />
//     </View>
//   );
// };

// /**
//  * ======================================================
//  * STYLES
//  * ======================================================
//  */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* Header */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingBottom: 10,
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 22,
//     fontWeight: 'bold',
//   },

//   /* Reel Container */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     position: 'relative',
//     backgroundColor: '#000',
//   },
//   videoWrapper: {
//     flex: 1,
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   /* Buffering & Paused */
//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//   },
//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* Double Tap Heart */
//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* Right Side Actions */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     bottom: 120,
//     alignItems: 'center',
//   },
//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   actionText: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 4,
//     fontWeight: '600',
//   },
//   avatarButton: {
//     marginTop: 10,
//   },
//   actionAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* Bottom Overlay */
//   bottomOverlay: {
//     position: 'absolute',
//     bottom: 80,
//     left: 16,
//     right: 80,
//   },
//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     borderWidth: 2,
//     borderColor: '#fff',
//     marginRight: 10,
//   },
//   username: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
//   followButton: {
//     marginLeft: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#fff',
//     borderRadius: 4,
//   },
//   followText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 10,
//     lineHeight: 18,
//   },
//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     marginLeft: 6,
//   },

//   /* Empty State */
//   emptyText: {
//     color: '#888',
//     fontSize: 16,
//     marginTop: 16,
//   },
//   uploadButton: {
//     marginTop: 20,
//     backgroundColor: colors.primary,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   uploadButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
// });

// export default ReelsScreen;




// import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
// } from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';
// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// /**
//  * ======================================================
//  * SINGLE REEL ITEM COMPONENT (MEMOIZED)
//  * ======================================================
//  */
// const ReelItem = memo(({
//   item,
//   isActive,
//   isScreenFocused,
//   currentUserId,
//   topInset = 0,
//   bottomInset = 0,
//   onLike,
//   onDoubleTap,
//   onSingleTap,
//   onUserPress,
//   onCommentPress,
//   onSharePress,
// }) => {
//   const videoRef = useRef(null);
//   const [isPaused, setIsPaused] = useState(false);
//   const [isBuffering, setIsBuffering] = useState(true);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const heartScale = useRef(new Animated.Value(0)).current;
//   const lastTap = useRef(0);

//   // Check if this is the current user's reel
//   const isOwnReel = currentUserId && item.user?._id === currentUserId;

//   // Should video play? Only if: active in list AND screen is focused AND not manually paused AND loaded
//   const shouldPlay = isActive && isScreenFocused && !isPaused && isLoaded;

//   /* =========================
//      PLAY/PAUSE BASED ON VISIBILITY & SCREEN FOCUS
//   ========================= */
//   useEffect(() => {
//     if (videoRef.current) {
//       if (shouldPlay) {
//         console.log('▶️ Playing video:', item._id);
//         videoRef.current.playAsync();
//       } else {
//         console.log('⏸️ Pausing video:', item._id, { isActive, isScreenFocused, isPaused });
//         videoRef.current.pauseAsync();
//       }
//     }
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP ON UNMOUNT
//   ========================= */
//   useEffect(() => {
//     return () => {
//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET STATE WHEN ITEM CHANGES
//   ========================= */
//   useEffect(() => {
//     setIsLoaded(false);
//     setIsPaused(false);
//     setIsBuffering(true);
//   }, [item._id]);

//   /* =========================
//      HANDLE TAP (SINGLE/DOUBLE)
//   ========================= */
//   const handleTap = () => {
//     const now = Date.now();
//     const DOUBLE_TAP_DELAY = 300;

//     if (now - lastTap.current < DOUBLE_TAP_DELAY) {
//       // Double tap - Like
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       // Single tap - Pause/Play
//       lastTap.current = now;
//       setTimeout(() => {
//         if (lastTap.current !== 0 && Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
//           handleSingleTap();
//         }
//       }, DOUBLE_TAP_DELAY);
//     }
//   };

//   const handleSingleTap = () => {
//     setIsPaused((prev) => !prev);
//     onSingleTap?.();
//   };

//   const handleDoubleTap = () => {
//     // Animate heart
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         friction: 3,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Only like if not already liked
//     if (!item.isLiked) {
//       onLike(item._id);
//     }
    
//     onDoubleTap?.();
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = (status) => {
//     if (status.isLoaded) {
//       setIsBuffering(status.isBuffering);
//     }
//     if (status.error) {
//       console.error('❌ Video playback error:', status.error);
//     }
//   };

//   /* =========================
//      VIDEO LOAD ERROR
//   ========================= */
//   const onVideoError = (error) => {
//     console.error('❌ Video load error:', error);
//     console.log('🎬 Failed video URL:', item.videoUrl);
//     setIsLoaded(false);
//   };

//   /* =========================
//      VIDEO READY
//   ========================= */
//   const onVideoLoad = (status) => {
//     console.log('✅ Video loaded:', item._id, status.durationMillis);
//     setIsBuffering(false);
//     setIsLoaded(true);
//   };

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             shouldPlay={false}
//             isLooping
//             isMuted={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onError={onVideoError}
//             onLoad={onVideoLoad}
//             progressUpdateIntervalMillis={500}
//           />

//           {/* Buffering Indicator */}
//           {isBuffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {/* Paused Indicator */}
//           {isPaused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
//             </View>
//           )}

//           {/* Double Tap Heart Animation */}
//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* Right Side Actions */}
//       <View style={[styles.actionsContainer, { bottom: 120 + bottomInset }]}>
//         {/* Like */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={30}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         {/* Comment */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="chatbubble-outline" size={28} color="#fff" />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         {/* Share */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="paper-plane-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         {/* More Options */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
//         </TouchableOpacity>

//         {/* User Avatar */}
//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//           activeOpacity={0.7}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* Bottom Overlay - User Info & Caption */}
//       <View style={[styles.bottomOverlay, { bottom: 80 + bottomInset }]}>
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//           activeOpacity={0.7}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>
//           {/* ✅ Only show follow button if NOT own reel */}
//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {item.caption ? (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         ) : null}

//         {/* Audio/Music Row */}
//         <View style={styles.audioRow}>
//           <Ionicons name="musical-notes" size={14} color="#fff" />
//           <Text style={styles.audioText} numberOfLines={1}>
//             {item.audioName || 'Original Audio'}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }, (prevProps, nextProps) => {
//   // Custom comparison - only re-render when these change
//   return (
//     prevProps.item._id === nextProps.item._id &&
//     prevProps.isActive === nextProps.isActive &&
//     prevProps.isScreenFocused === nextProps.isScreenFocused &&
//     prevProps.item.isLiked === nextProps.item.isLiked &&
//     prevProps.item.likesCount === nextProps.item.likesCount &&
//     prevProps.currentUserId === nextProps.currentUserId &&
//     prevProps.topInset === nextProps.topInset &&
//     prevProps.bottomInset === nextProps.bottomInset
//   );
// });

// /**
//  * ======================================================
//  * FORMAT NUMBERS (1K, 1M, etc.)
//  * ======================================================
//  */
// const formatCount = (count) => {
//   if (!count || count === 0) return '0';
//   if (count >= 1000000) {
//     return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }
//   if (count >= 1000) {
//     return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
//   }
//   return count.toString();
// };

// /**
//  * ======================================================
//  * MAIN REELS SCREEN
//  * ======================================================
//  */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();
  
//   // ✅ Detect if this tab/screen is focused
//   const isScreenFocused = useIsFocused();

//   const { reels, loading, refreshing, error, currentIndex, pagination } =
//     useSelector((state) => state.reels);
  
//   // ✅ Get current user ID
//   const currentUserId = useSelector((state) => state.auth.user?._id);

//   const [visibleIndex, setVisibleIndex] = useState(0);
//   const viewedReels = useRef(new Set());
//   const flatListRef = useRef(null);

//   /* =========================
//      LOAD REELS ON MOUNT (NOT EVERY FOCUS)
//   ========================= */
//   useEffect(() => {
//     // Only fetch if we don't have reels yet
//     if (reels.length === 0) {
//       console.log('🎬 ReelsScreen mounted, fetching reels...');
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch]);

//   /* =========================
//      DEBUG: Log reels data (only when changed)
//   ========================= */
//   useEffect(() => {
//     if (__DEV__) {
//       console.log('🎬 Reels state:', {
//         count: reels.length,
//         loading,
//         error,
//         isScreenFocused,
//         firstReel: reels[0] ? {
//           id: reels[0]._id,
//           videoUrl: reels[0].videoUrl,
//           user: reels[0].user?.username,
//         } : null,
//       });
//     }
//   }, [reels.length, loading, error]);

//   /* =========================
//      SYNC VISIBLE INDEX WITH REDUX
//   ========================= */
//   useEffect(() => {
//     dispatch(setCurrentIndex(visibleIndex));
//   }, [visibleIndex, dispatch]);

//   /* =========================
//      TRACK VIEW COUNT (only when focused)
//   ========================= */
//   useEffect(() => {
//     if (!isScreenFocused) return; // Don't track if screen not focused
    
//     if (reels.length > 0 && visibleIndex >= 0) {
//       const currentReel = reels[visibleIndex];
//       if (currentReel && !viewedReels.current.has(currentReel._id)) {
//         viewedReels.current.add(currentReel._id);
//         dispatch(trackReelView(currentReel._id));
//       }
//     }
//   }, [visibleIndex, reels.length, isScreenFocused, dispatch]);

//   /* =========================
//      VISIBILITY CONFIG
//   ========================= */
//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 80, // Higher threshold for more accurate detection
//     minimumViewTime: 100,
//   }).current;

//   const onViewableItemsChanged = useRef(({ viewableItems }) => {
//     if (viewableItems.length > 0) {
//       const index = viewableItems[0].index;
//       if (index !== null && index !== undefined) {
//         setVisibleIndex(index);
//       }
//     }
//   }).current;

//   /* =========================
//      HANDLERS
//   ========================= */
//   const handleLike = useCallback(
//     (reelId) => {
//       dispatch(toggleReelLike(reelId));
//     },
//     [dispatch]
//   );

//   const handleUserPress = useCallback(
//     (user) => {
//       if (user?._id) {
//         navigation.navigate(ROUTES.USER_PROFILE, { userId: user._id });
//       }
//     },
//     [navigation]
//   );

//   const handleCommentPress = useCallback(
//     (reelId) => {
//       // Navigate to comments with type: 'reel' so CommentsScreen knows which API to use
//       navigation.navigate(ROUTES.COMMENTS, {
//         postId: reelId,
//         type: 'reel', // ✅ This tells CommentsScreen to use reel comments API
//       });
//     },
//     [navigation]
//   );

//   const handleSharePress = useCallback((reel) => {
//     // TODO: Implement share functionality
//     console.log('Share reel:', reel._id);
//   }, []);

//   const handleRefresh = useCallback(() => {
//     viewedReels.current.clear(); // Clear viewed reels on refresh
//     dispatch(fetchReels({ page: 1 }));
//   }, [dispatch]);

//   const handleLoadMore = useCallback(() => {
//     if (!refreshing && pagination.page < pagination.totalPages) {
//       dispatch(fetchReels({ page: pagination.page + 1 }));
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* =========================
//      RENDER ITEM
//   ========================= */
//   const renderItem = useCallback(
//     ({ item, index }) => (
//       <ReelItem
//         item={item}
//         isActive={index === visibleIndex}
//         isScreenFocused={isScreenFocused}
//         currentUserId={currentUserId}
//         topInset={insets.top}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUserPress}
//         onCommentPress={handleCommentPress}
//         onSharePress={handleSharePress}
//       />
//     ),
//     [visibleIndex, isScreenFocused, currentUserId, insets.top, insets.bottom, handleLike, handleUserPress, handleCommentPress, handleSharePress]
//   );

//   const keyExtractor = useCallback((item) => item._id, []);

//   const getItemLayout = useCallback(
//     (data, index) => ({
//       length: SCREEN_HEIGHT,
//       offset: SCREEN_HEIGHT * index,
//       index,
//     }),
//     []
//   );

//   /* =========================
//      LOADING STATE
//   ========================= */
//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
//   }

//   /* =========================
//      EMPTY STATE
//   ========================= */
//   if (!loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="videocam-outline" size={60} color="#555" />
//         <Text style={styles.emptyText}>No Reels yet</Text>
//         <TouchableOpacity
//           style={styles.uploadButton}
//           onPress={() => navigation.navigate(ROUTES.UPLOAD_REEL)}
//         >
//           <Text style={styles.uploadButtonText}>Create a Reel</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   /* =========================
//      MAIN RENDER
//   ========================= */
//   return (
//     <View style={styles.container}>
//       {/* Header with safe area */}
//       <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//         <Text style={styles.headerTitle}>Reels</Text>
//         <TouchableOpacity
//           onPress={() => navigation.navigate(ROUTES.UPLOAD_REEL)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         ref={flatListRef}
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         pagingEnabled
//         showsVerticalScrollIndicator={false}
//         snapToInterval={SCREEN_HEIGHT}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewabilityConfig}
//         getItemLayout={getItemLayout}
//         onRefresh={handleRefresh}
//         refreshing={refreshing}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={Platform.OS === 'android'}
//         maxToRenderPerBatch={2}
//         windowSize={3}
//         initialNumToRender={1}
//         updateCellsBatchingPeriod={100}
//         extraData={isScreenFocused}
//         contentContainerStyle={{ paddingTop: 0 }}
//       />
//     </View>
//   );
// };

// /**
//  * ======================================================
//  * STYLES
//  * ======================================================
//  */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* Header */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     backgroundColor: '#000',
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 22,
//     fontWeight: 'bold',
//   },

//   /* Reel Container */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     position: 'relative',
//     backgroundColor: '#000',
//   },
//   videoWrapper: {
//     flex: 1,
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   /* Buffering & Paused */
//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//   },
//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* Double Tap Heart */
//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* Right Side Actions */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//   },
//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   actionText: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 4,
//     fontWeight: '600',
//   },
//   avatarButton: {
//     marginTop: 10,
//   },
//   actionAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* Bottom Overlay */
//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },
//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     borderWidth: 2,
//     borderColor: '#fff',
//     marginRight: 10,
//   },
//   username: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
//   followButton: {
//     marginLeft: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#fff',
//     borderRadius: 4,
//   },
//   followText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 10,
//     lineHeight: 18,
//   },
//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     marginLeft: 6,
//   },

//   /* Empty State */
//   emptyText: {
//     color: '#888',
//     fontSize: 16,
//     marginTop: 16,
//   },
//   uploadButton: {
//     marginTop: 20,
//     backgroundColor: colors.primary,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   uploadButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
// });

// export default ReelsScreen;








// import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
// } from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';
// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// /**
//  * ======================================================
//  * SINGLE REEL ITEM COMPONENT (MEMOIZED)
//  * ======================================================
//  */
// const ReelItem = memo(({
//   item,
//   isActive,
//   isScreenFocused,
//   currentUserId,
//   topInset = 0,
//   bottomInset = 0,
//   onLike,
//   onDoubleTap,
//   onSingleTap,
//   onUserPress,
//   onCommentPress,
//   onSharePress,
// }) => {
//   const videoRef = useRef(null);
//   const [isPaused, setIsPaused] = useState(false);
//   const [isBuffering, setIsBuffering] = useState(true);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const heartScale = useRef(new Animated.Value(0)).current;
//   const lastTap = useRef(0);

//   // Check if this is the current user's reel
//   const isOwnReel = currentUserId && item.user?._id === currentUserId;

//   // Should video play? Only if: active in list AND screen is focused AND not manually paused AND loaded
//   const shouldPlay = isActive && isScreenFocused && !isPaused && isLoaded;

//   /* =========================
//      PLAY/PAUSE BASED ON VISIBILITY & SCREEN FOCUS
//   ========================= */
//   useEffect(() => {
//     if (videoRef.current) {
//       if (shouldPlay) {
//         console.log('▶️ Playing video:', item._id);
//         videoRef.current.playAsync();
//       } else {
//         console.log('⏸️ Pausing video:', item._id, { isActive, isScreenFocused, isPaused });
//         videoRef.current.pauseAsync();
//       }
//     }
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP ON UNMOUNT
//   ========================= */
//   useEffect(() => {
//     return () => {
//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET STATE WHEN ITEM CHANGES
//   ========================= */
//   useEffect(() => {
//     setIsLoaded(false);
//     setIsPaused(false);
//     setIsBuffering(true);
//   }, [item._id]);

//   /* =========================
//      HANDLE TAP (SINGLE/DOUBLE)
//   ========================= */
//   const handleTap = () => {
//     const now = Date.now();
//     const DOUBLE_TAP_DELAY = 300;

//     if (now - lastTap.current < DOUBLE_TAP_DELAY) {
//       // Double tap - Like
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       // Single tap - Pause/Play
//       lastTap.current = now;
//       setTimeout(() => {
//         if (lastTap.current !== 0 && Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
//           handleSingleTap();
//         }
//       }, DOUBLE_TAP_DELAY);
//     }
//   };

//   const handleSingleTap = () => {
//     setIsPaused((prev) => !prev);
//     onSingleTap?.();
//   };

//   const handleDoubleTap = () => {
//     // Animate heart
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         friction: 3,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Only like if not already liked
//     if (!item.isLiked) {
//       onLike(item._id);
//     }
    
//     onDoubleTap?.();
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = (status) => {
//     if (status.isLoaded) {
//       setIsBuffering(status.isBuffering);
//     }
//     if (status.error) {
//       console.error('❌ Video playback error:', status.error);
//     }
//   };

//   /* =========================
//      VIDEO LOAD ERROR
//   ========================= */
//   const onVideoError = (error) => {
//     console.error('❌ Video load error:', error);
//     console.log('🎬 Failed video URL:', item.videoUrl);
//     setIsLoaded(false);
//   };

//   /* =========================
//      VIDEO READY
//   ========================= */
//   const onVideoLoad = (status) => {
//     console.log('✅ Video loaded:', item._id, status.durationMillis);
//     setIsBuffering(false);
//     setIsLoaded(true);
//   };

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             shouldPlay={false}
//             isLooping
//             isMuted={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onError={onVideoError}
//             onLoad={onVideoLoad}
//             progressUpdateIntervalMillis={500}
//           />

//           {/* Buffering Indicator */}
//           {isBuffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {/* Paused Indicator */}
//           {isPaused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
//             </View>
//           )}

//           {/* Double Tap Heart Animation */}
//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* Right Side Actions */}
//       <View style={[styles.actionsContainer, { bottom: 120 + bottomInset }]}>
//         {/* Like */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={30}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         {/* Comment */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="chatbubble-outline" size={28} color="#fff" />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         {/* Share */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="paper-plane-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         {/* More Options */}
//         <TouchableOpacity
//           style={styles.actionButton}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
//         </TouchableOpacity>

//         {/* User Avatar */}
//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//           activeOpacity={0.7}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* Bottom Overlay - User Info & Caption */}
//       <View style={[styles.bottomOverlay, { bottom: 80 + bottomInset }]}>
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//           activeOpacity={0.7}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>
//           {/* ✅ Only show follow button if NOT own reel */}
//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {item.caption ? (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         ) : null}

//         {/* Audio/Music Row */}
//         <View style={styles.audioRow}>
//           <Ionicons name="musical-notes" size={14} color="#fff" />
//           <Text style={styles.audioText} numberOfLines={1}>
//             {item.audioName || 'Original Audio'}
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }, (prevProps, nextProps) => {
//   // Custom comparison - only re-render when these change
//   return (
//     prevProps.item._id === nextProps.item._id &&
//     prevProps.isActive === nextProps.isActive &&
//     prevProps.isScreenFocused === nextProps.isScreenFocused &&
//     prevProps.item.isLiked === nextProps.item.isLiked &&
//     prevProps.item.likesCount === nextProps.item.likesCount &&
//     prevProps.currentUserId === nextProps.currentUserId &&
//     prevProps.topInset === nextProps.topInset &&
//     prevProps.bottomInset === nextProps.bottomInset
//   );
// });

// /**
//  * ======================================================
//  * FORMAT NUMBERS (1K, 1M, etc.)
//  * ======================================================
//  */
// const formatCount = (count) => {
//   if (!count || count === 0) return '0';
//   if (count >= 1000000) {
//     return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }
//   if (count >= 1000) {
//     return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
//   }
//   return count.toString();
// };

// /**
//  * ======================================================
//  * MAIN REELS SCREEN
//  * ======================================================
//  */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();
  
//   // ✅ Detect if this tab/screen is focused
//   const isScreenFocused = useIsFocused();

//   const { reels, loading, refreshing, error, currentIndex, pagination } =
//     useSelector((state) => state.reels);
  
//   // ✅ Get current user ID
//   const currentUserId = useSelector((state) => state.auth.user?._id);

//   const [visibleIndex, setVisibleIndex] = useState(0);
//   const viewedReels = useRef(new Set());
//   const flatListRef = useRef(null);

//   /* =========================
//      LOAD REELS ON MOUNT (NOT EVERY FOCUS)
//   ========================= */
//   useEffect(() => {
//     // Only fetch if we don't have reels yet
//     if (reels.length === 0) {
//       console.log('🎬 ReelsScreen mounted, fetching reels...');
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch]);

//   /* =========================
//      DEBUG: Log reels data (only when changed)
//   ========================= */
//   useEffect(() => {
//     if (__DEV__) {
//       console.log('🎬 Reels state:', {
//         count: reels.length,
//         loading,
//         error,
//         isScreenFocused,
//         firstReel: reels[0] ? {
//           id: reels[0]._id,
//           videoUrl: reels[0].videoUrl,
//           user: reels[0].user?.username,
//         } : null,
//       });
//     }
//   }, [reels.length, loading, error]);

//   /* =========================
//      SYNC VISIBLE INDEX WITH REDUX
//   ========================= */
//   useEffect(() => {
//     dispatch(setCurrentIndex(visibleIndex));
//   }, [visibleIndex, dispatch]);

//   /* =========================
//      TRACK VIEW COUNT (only when focused)
//   ========================= */
//   useEffect(() => {
//     if (!isScreenFocused) return; // Don't track if screen not focused
    
//     if (reels.length > 0 && visibleIndex >= 0) {
//       const currentReel = reels[visibleIndex];
//       if (currentReel && !viewedReels.current.has(currentReel._id)) {
//         viewedReels.current.add(currentReel._id);
//         dispatch(trackReelView(currentReel._id));
//       }
//     }
//   }, [visibleIndex, reels.length, isScreenFocused, dispatch]);

//   /* =========================
//      VISIBILITY CONFIG
//   ========================= */
//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 80, // Higher threshold for more accurate detection
//     minimumViewTime: 100,
//   }).current;

//   const onViewableItemsChanged = useRef(({ viewableItems }) => {
//     if (viewableItems.length > 0) {
//       const index = viewableItems[0].index;
//       if (index !== null && index !== undefined) {
//         setVisibleIndex(index);
//       }
//     }
//   }).current;

//   /* =========================
//      HANDLERS
//   ========================= */
//   const handleLike = useCallback(
//     (reelId) => {
//       dispatch(toggleReelLike(reelId));
//     },
//     [dispatch]
//   );

//   const handleUserPress = useCallback(
//     (user) => {
//       if (user?._id) {
//         navigation.navigate(ROUTES.USER_PROFILE, { userId: user._id });
//       }
//     },
//     [navigation]
//   );

//   const handleCommentPress = useCallback(
//     (reelId) => {
//       // Navigate to comments with type: 'reel' so CommentsScreen knows which API to use
//       navigation.navigate(ROUTES.COMMENTS, {
//         reelId: reelId,
//         type: 'reel', // ✅ This tells CommentsScreen to use reel comments API
//       });
//     },
//     [navigation]
//   );

//   const handleSharePress = useCallback((reel) => {
//     // TODO: Implement share functionality
//     console.log('Share reel:', reel._id);
//   }, []);

//   const handleRefresh = useCallback(() => {
//     viewedReels.current.clear(); // Clear viewed reels on refresh
//     dispatch(fetchReels({ page: 1 }));
//   }, [dispatch]);

//   const handleLoadMore = useCallback(() => {
//     if (!refreshing && pagination.page < pagination.totalPages) {
//       dispatch(fetchReels({ page: pagination.page + 1 }));
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* =========================
//      RENDER ITEM
//   ========================= */
//   const renderItem = useCallback(
//     ({ item, index }) => (
//       <ReelItem
//         item={item}
//         isActive={index === visibleIndex}
//         isScreenFocused={isScreenFocused}
//         currentUserId={currentUserId}
//         topInset={insets.top}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUserPress}
//         onCommentPress={handleCommentPress}
//         onSharePress={handleSharePress}
//       />
//     ),
//     [visibleIndex, isScreenFocused, currentUserId, insets.top, insets.bottom, handleLike, handleUserPress, handleCommentPress, handleSharePress]
//   );

//   const keyExtractor = useCallback((item) => item._id, []);

//   const getItemLayout = useCallback(
//     (data, index) => ({
//       length: SCREEN_HEIGHT,
//       offset: SCREEN_HEIGHT * index,
//       index,
//     }),
//     []
//   );

//   /* =========================
//      LOADING STATE
//   ========================= */
//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
//   }

//   /* =========================
//      EMPTY STATE
//   ========================= */
//   if (!loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="videocam-outline" size={60} color="#555" />
//         <Text style={styles.emptyText}>No Reels yet</Text>
//         <TouchableOpacity
//           style={styles.uploadButton}
//           onPress={() => navigation.navigate(ROUTES.UPLOAD_REEL)}
//         >
//           <Text style={styles.uploadButtonText}>Create a Reel</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   /* =========================
//      MAIN RENDER
//   ========================= */
//   return (
//     <View style={styles.container}>
//       {/* Header with safe area */}
//       <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//         <Text style={styles.headerTitle}>Reels</Text>
//         <TouchableOpacity
//           onPress={() => navigation.navigate(ROUTES.UPLOAD_REEL)}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         ref={flatListRef}
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         pagingEnabled
//         showsVerticalScrollIndicator={false}
//         snapToInterval={SCREEN_HEIGHT}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewabilityConfig}
//         getItemLayout={getItemLayout}
//         onRefresh={handleRefresh}
//         refreshing={refreshing}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={Platform.OS === 'android'}
//         maxToRenderPerBatch={2}
//         windowSize={3}
//         initialNumToRender={1}
//         updateCellsBatchingPeriod={100}
//         extraData={isScreenFocused}
//         contentContainerStyle={{ paddingTop: 0 }}
//       />
//     </View>
//   );
// };

// /**
//  * ======================================================
//  * STYLES
//  * ======================================================
//  */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* Header */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     backgroundColor: '#000',
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 22,
//     fontWeight: 'bold',
//   },

//   /* Reel Container */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     position: 'relative',
//     backgroundColor: '#000',
//   },
//   videoWrapper: {
//     flex: 1,
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   /* Buffering & Paused */
//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//   },
//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* Double Tap Heart */
//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* Right Side Actions */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//   },
//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   actionText: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 4,
//     fontWeight: '600',
//   },
//   avatarButton: {
//     marginTop: 10,
//   },
//   actionAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* Bottom Overlay */
//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },
//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     borderWidth: 2,
//     borderColor: '#fff',
//     marginRight: 10,
//   },
//   username: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
//   followButton: {
//     marginLeft: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#fff',
//     borderRadius: 4,
//   },
//   followText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 10,
//     lineHeight: 18,
//   },
//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     marginLeft: 6,
//   },

//   /* Empty State */
//   emptyText: {
//     color: '#888',
//     fontSize: 16,
//     marginTop: 16,
//   },
//   uploadButton: {
//     marginTop: 20,
//     backgroundColor: colors.primary,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   uploadButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
// });

// export default ReelsScreen;









// import React, {
//   useState,
//   useCallback,
//   useRef,
//   useEffect,
//   memo,
// } from 'react';

// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
// } from 'react-native';

// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';

// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
//   Dimensions.get('window');

// /* ======================================================
//    FORMAT COUNTS
// ====================================================== */
// const formatCount = (count = 0) => {
//   if (count < 1000) return String(count);

//   if (count >= 1_000_000) {
//     return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }

//   return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
// };

// /* ======================================================
//    SINGLE REEL
// ====================================================== */
// const ReelItem = memo((props) => {
//   const {
//     item,
//     isActive,
//     isScreenFocused,
//     currentUserId,
//     bottomInset,
//     onLike,
//     onUserPress,
//     onCommentPress,
//     onSharePress,
//   } = props;

//   const videoRef = useRef(null);
//   const lastTap = useRef(0);
//   const timeoutRef = useRef(null);

//   const heartScale = useRef(new Animated.Value(0)).current;

//   const [paused, setPaused] = useState(false);
//   const [buffering, setBuffering] = useState(true);
//   const [loaded, setLoaded] = useState(false);

//   const isOwnReel =
//     currentUserId && item?.user?._id === currentUserId;

//   const shouldPlay =
//     isActive && isScreenFocused && !paused && loaded;

//   /* =========================
//      PLAY CONTROL
//   ========================= */
//   useEffect(() => {
//     const control = async () => {
//       try {
//         if (!videoRef.current) return;

//         if (shouldPlay) {
//           await videoRef.current.playAsync();
//         } else {
//           await videoRef.current.pauseAsync();
//         }
//       } catch {}
//     };

//     control();
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP
//   ========================= */
//   useEffect(() => {
//     return () => {
//       clearTimeout(timeoutRef.current);

//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET ON ITEM CHANGE
//   ========================= */
//   useEffect(() => {
//     setPaused(false);
//     setLoaded(false);
//     setBuffering(true);
//   }, [item?._id]);

//   /* =========================
//      TAP HANDLER
//   ========================= */
//   const handleTap = useCallback(() => {
//     const now = Date.now();
//     const delay = 300;

//     if (now - lastTap.current < delay) {
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       lastTap.current = now;

//       timeoutRef.current = setTimeout(() => {
//         if (lastTap.current !== 0) {
//           setPaused((p) => !p);
//         }
//       }, delay);
//     }
//   }, []);

//   /* =========================
//      DOUBLE TAP
//   ========================= */
//   const handleDoubleTap = () => {
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     if (!item?.isLiked) {
//       onLike(item._id);
//     }
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = useCallback((status) => {
//     if (status.isLoaded) {
//       setBuffering(status.isBuffering);
//     }

//     if (status.error) {
//       console.error('Video error:', status.error);
//     }
//   }, []);

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             isLooping
//             shouldPlay={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onLoad={() => setLoaded(true)}
//             onError={(e) => console.log(e)}
//           />

//           {buffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {paused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons
//                 name="play"
//                 size={60}
//                 color="rgba(255,255,255,0.8)"
//               />
//             </View>
//           )}

//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* ACTIONS */}
//       <View
//         style={[
//           styles.actionsContainer,
//           { bottom: 120 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={30}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//         >
//           <Ionicons
//             name="chatbubble-outline"
//             size={28}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//         >
//           <Ionicons
//             name="paper-plane-outline"
//             size={28}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* BOTTOM */}
//       <View
//         style={[
//           styles.bottomOverlay,
//           { bottom: 80 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />

//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>

//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {!!item.caption && (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         )}
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    MAIN SCREEN
// ====================================================== */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const isFocused = useIsFocused();

//   const { reels, loading, refreshing, pagination } =
//     useSelector((s) => s.reels);

//   const userId = useSelector(
//     (s) => s.auth.user?._id
//   );

//   const viewed = useRef(new Set());

//   const [index, setIndex] = useState(0);

//   /* LOAD */
//   useEffect(() => {
//     if (reels.length === 0) {
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch, reels.length]);

//   /* SYNC */
//   useEffect(() => {
//     dispatch(setCurrentIndex(index));
//   }, [index, dispatch]);

//   /* VIEW TRACK */
//   useEffect(() => {
//     if (!isFocused) return;

//     const reel = reels[index];

//     if (reel && !viewed.current.has(reel._id)) {
//       viewed.current.add(reel._id);
//       dispatch(trackReelView(reel._id));
//     }
//   }, [index, reels, isFocused, dispatch]);

//   /* HANDLERS */
//   const handleLike = useCallback(
//     (id) => dispatch(toggleReelLike(id)),
//     [dispatch]
//   );

//   const handleUser = useCallback(
//     (u) =>
//       u?._id &&
//       navigation.navigate(ROUTES.USER_PROFILE, {
//         userId: u._id,
//       }),
//     [navigation]
//   );

//   const handleComment = useCallback(
//     (id) =>
//       navigation.navigate(ROUTES.COMMENTS, {
//         reelId: id,
//         type: 'reel',
//       }),
//     [navigation]
//   );

//   const handleLoadMore = useCallback(() => {
//     if (
//       !refreshing &&
//       pagination.page < pagination.totalPages
//     ) {
//       dispatch(
//         fetchReels({ page: pagination.page + 1 })
//       );
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* VIEWABILITY */
//   const viewConfig = useRef({
//     itemVisiblePercentThreshold: 80,
//   }).current;

//   const onViewable = useRef(({ viewableItems }) => {
//     if (viewableItems[0]?.index != null) {
//       setIndex(viewableItems[0].index);
//     }
//   }).current;

//   /* RENDER */
//   const renderItem = useCallback(
//     ({ item, index: i }) => (
//       <ReelItem
//         item={item}
//         isActive={i === index}
//         isScreenFocused={isFocused}
//         currentUserId={userId}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUser}
//         onCommentPress={handleComment}
//         onSharePress={() => {}}
//       />
//     ),
//     [
//       index,
//       isFocused,
//       userId,
//       insets.bottom,
//       handleLike,
//       handleUser,
//       handleComment,
//     ]
//   );

//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator
//           size="large"
//           color={colors.primary}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={(i) => i._id || Math.random()}
//         pagingEnabled
//         snapToInterval={SCREEN_HEIGHT}
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewable}
//         viewabilityConfig={viewConfig}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={
//           Platform.OS === 'android'
//         }
//         initialNumToRender={1}
//         windowSize={3}
//         maxToRenderPerBatch={2}
//         extraData={isFocused}
//       />
//     </View>
//   );
// };

// /* ======================================================
//    STYLES
// ====================================================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//   },

//   videoWrapper: {
//     flex: 1,
//   },

//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//   },

//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },

//   actionText: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 4,
//     fontWeight: '600',
//   },

//   avatarButton: {
//     marginTop: 10,
//   },

//   actionAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },

//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     borderWidth: 2,
//     borderColor: '#fff',
//     marginRight: 10,
//   },

//   username: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 15,
//   },

//   followButton: {
//     marginLeft: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#fff',
//     borderRadius: 4,
//   },

//   followText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },

//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 10,
//     lineHeight: 18,
//   },
// });

// export default ReelsScreen;








// import React, {
//   useState,
//   useCallback,
//   useRef,
//   useEffect,
//   memo,
// } from 'react';

// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
//   StatusBar,
// } from 'react-native';

// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';

// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// // NOTE: Make sure ROUTES.UPLOAD_REEL is defined in your routes.constants file
// // Example: export const ROUTES = { ..., UPLOAD_REEL: 'UploadReel', ... }

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
//   Dimensions.get('window');

// /* ======================================================
//    FORMAT COUNTS
// ====================================================== */
// const formatCount = (count = 0) => {
//   if (count < 1000) return String(count);

//   if (count >= 1_000_000) {
//     return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }

//   return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
// };

// /* ======================================================
//    HEADER COMPONENT
// ====================================================== */
// const ReelsHeader = memo(() => {
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();

//   const handleCreateReel = () => {
//     navigation.navigate(ROUTES.UPLOAD_REEL);
//   };

//   return (
//     <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//       <View style={styles.headerContent}>
//         <TouchableOpacity 
//           style={styles.plusButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="add-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         <View style={styles.tabsContainer}>
//           <TouchableOpacity style={styles.tab}>
//             <Text style={[styles.tabText, styles.activeTab]}>Reels</Text>
//             <View style={styles.activeIndicator} />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.tab}>
//             <Text style={styles.tabText}>Friends</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity 
//           style={styles.cameraButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    SINGLE REEL
// ====================================================== */
// const ReelItem = memo((props) => {
//   const {
//     item,
//     isActive,
//     isScreenFocused,
//     currentUserId,
//     bottomInset,
//     onLike,
//     onUserPress,
//     onCommentPress,
//     onSharePress,
//   } = props;

//   const videoRef = useRef(null);
//   const lastTap = useRef(0);
//   const timeoutRef = useRef(null);

//   const heartScale = useRef(new Animated.Value(0)).current;

//   const [paused, setPaused] = useState(false);
//   const [buffering, setBuffering] = useState(true);
//   const [loaded, setLoaded] = useState(false);

//   const isOwnReel =
//     currentUserId && item?.user?._id === currentUserId;

//   const shouldPlay =
//     isActive && isScreenFocused && !paused && loaded;

//   /* =========================
//      PLAY CONTROL
//   ========================= */
//   useEffect(() => {
//     const control = async () => {
//       try {
//         if (!videoRef.current) return;

//         if (shouldPlay) {
//           await videoRef.current.playAsync();
//         } else {
//           await videoRef.current.pauseAsync();
//         }
//       } catch {}
//     };

//     control();
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP
//   ========================= */
//   useEffect(() => {
//     return () => {
//       clearTimeout(timeoutRef.current);

//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET ON ITEM CHANGE
//   ========================= */
//   useEffect(() => {
//     setPaused(false);
//     setLoaded(false);
//     setBuffering(true);
//   }, [item?._id]);

//   /* =========================
//      TAP HANDLER
//   ========================= */
//   const handleTap = useCallback(() => {
//     const now = Date.now();
//     const delay = 300;

//     if (now - lastTap.current < delay) {
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       lastTap.current = now;

//       timeoutRef.current = setTimeout(() => {
//         if (lastTap.current !== 0) {
//           setPaused((p) => !p);
//         }
//       }, delay);
//     }
//   }, []);

//   /* =========================
//      DOUBLE TAP
//   ========================= */
//   const handleDoubleTap = () => {
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     if (!item?.isLiked) {
//       onLike(item._id);
//     }
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = useCallback((status) => {
//     if (status.isLoaded) {
//       setBuffering(status.isBuffering);
//     }

//     if (status.error) {
//       console.error('Video error:', status.error);
//     }
//   }, []);

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             isLooping
//             shouldPlay={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onLoad={() => setLoaded(true)}
//             onError={(e) => console.log(e)}
//           />

//           {buffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {paused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons
//                 name="play"
//                 size={60}
//                 color="rgba(255,255,255,0.8)"
//               />
//             </View>
//           )}

//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* ACTIONS - Right Side */}
//       <View
//         style={[
//           styles.actionsContainer,
//           { bottom: 120 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={32}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//         >
//           <Ionicons
//             name="chatbubble-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//         >
//           <Ionicons
//             name="paper-plane-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.sharesCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.actionButton}>
//           <Ionicons
//             name="ellipsis-vertical"
//             size={24}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* BOTTOM INFO */}
//       <View
//         style={[
//           styles.bottomOverlay,
//           { bottom: 60 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />

//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>

//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {!!item.caption && (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         )}

//         {/* Audio info - Instagram style */}
//         {item.audioName && (
//           <View style={styles.audioRow}>
//             <Ionicons name="musical-notes" size={14} color="#fff" />
//             <Text style={styles.audioText} numberOfLines={1}>
//               {item.audioName || 'Original audio'}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    MAIN SCREEN
// ====================================================== */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const isFocused = useIsFocused();

//   const { reels, loading, refreshing, pagination } =
//     useSelector((s) => s.reels);

//   const userId = useSelector(
//     (s) => s.auth.user?._id
//   );

//   const viewed = useRef(new Set());

//   const [index, setIndex] = useState(0);

//   /* LOAD */
//   useEffect(() => {
//     if (reels.length === 0) {
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch, reels.length]);

//   /* SYNC */
//   useEffect(() => {
//     dispatch(setCurrentIndex(index));
//   }, [index, dispatch]);

//   /* VIEW TRACK */
//   useEffect(() => {
//     if (!isFocused) return;

//     const reel = reels[index];

//     if (reel && !viewed.current.has(reel._id)) {
//       viewed.current.add(reel._id);
//       dispatch(trackReelView(reel._id));
//     }
//   }, [index, reels, isFocused, dispatch]);

//   /* HANDLERS */
//   const handleLike = useCallback(
//     (id) => dispatch(toggleReelLike(id)),
//     [dispatch]
//   );

//   const handleUser = useCallback(
//     (u) =>
//       u?._id &&
//       navigation.navigate(ROUTES.USER_PROFILE, {
//         userId: u._id,
//       }),
//     [navigation]
//   );

//   const handleComment = useCallback(
//     (id) =>
//       navigation.navigate(ROUTES.COMMENTS, {
//         reelId: id,
//         type: 'reel',
//       }),
//     [navigation]
//   );

//   const handleLoadMore = useCallback(() => {
//     if (
//       !refreshing &&
//       pagination.page < pagination.totalPages
//     ) {
//       dispatch(
//         fetchReels({ page: pagination.page + 1 })
//       );
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* VIEWABILITY */
//   const viewConfig = useRef({
//     itemVisiblePercentThreshold: 80,
//   }).current;

//   const onViewable = useRef(({ viewableItems }) => {
//     if (viewableItems[0]?.index != null) {
//       setIndex(viewableItems[0].index);
//     }
//   }).current;

//   /* RENDER */
//   const renderItem = useCallback(
//     ({ item, index: i }) => (
//       <ReelItem
//         item={item}
//         isActive={i === index}
//         isScreenFocused={isFocused}
//         currentUserId={userId}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUser}
//         onCommentPress={handleComment}
//         onSharePress={() => {}}
//       />
//     ),
//     [
//       index,
//       isFocused,
//       userId,
//       insets.bottom,
//       handleLike,
//       handleUser,
//       handleComment,
//     ]
//   );

//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator
//           size="large"
//           color={colors.primary}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
      
//       {/* Header */}
//       <ReelsHeader />

//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={(i) => i._id || Math.random()}
//         pagingEnabled
//         snapToInterval={SCREEN_HEIGHT}
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewable}
//         viewabilityConfig={viewConfig}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={
//           Platform.OS === 'android'
//         }
//         initialNumToRender={1}
//         windowSize={3}
//         maxToRenderPerBatch={2}
//         extraData={isFocused}
//         showsVerticalScrollIndicator={false}
//       />
//     </View>
//   );
// };

// /* ======================================================
//    STYLES
// ====================================================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* HEADER */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     backgroundColor: 'transparent',
//   },

//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//   },

//   plusButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   tabsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 24,
//   },

//   tab: {
//     paddingBottom: 4,
//     position: 'relative',
//   },

//   tabText: {
//     color: 'rgba(255, 255, 255, 0.6)',
//     fontSize: 17,
//     fontWeight: '600',
//   },

//   activeTab: {
//     color: '#fff',
//   },

//   activeIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 2,
//     backgroundColor: '#fff',
//     borderRadius: 1,
//   },

//   cameraButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* REEL */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//   },

//   videoWrapper: {
//     flex: 1,
//   },

//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* ACTIONS */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//     gap: 8,
//   },

//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },

//   actionText: {
//     color: '#fff',
//     fontSize: 13,
//     marginTop: 4,
//     fontWeight: '600',
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   avatarButton: {
//     marginTop: 8,
//   },

//   actionAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* BOTTOM INFO */
//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },

//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     marginRight: 10,
//   },

//   username: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   followButton: {
//     marginLeft: 10,
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     borderRadius: 6,
//   },

//   followText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 8,
//     lineHeight: 18,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },

//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '500',
//     flex: 1,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
// });

// export default ReelsScreen;












// import React, {
//   useState,
//   useCallback,
//   useRef,
//   useEffect,
//   memo,
// } from 'react';

// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
//   StatusBar,
// } from 'react-native';

// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';

// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// // NOTE: Make sure ROUTES.UPLOAD_REEL is defined in your routes.constants file
// // Example: export const ROUTES = { ..., UPLOAD_REEL: 'UploadReel', ... }

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
//   Dimensions.get('window');

// /* ======================================================
//    FORMAT COUNTS
// ====================================================== */
// const formatCount = (count = 0) => {
//   if (count < 1000) return String(count);

//   if (count >= 1_000_000) {
//     return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }

//   return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
// };

// /* ======================================================
//    HEADER COMPONENT
// ====================================================== */
// const ReelsHeader = memo(() => {
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();

//   const handleCreateReel = () => {
//     navigation.navigate(ROUTES.UPLOAD_REEL);
//   };

//   return (
//     <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//       <View style={styles.headerContent}>
//         <TouchableOpacity 
//           style={styles.plusButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="add-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         <View style={styles.tabsContainer}>
//           <TouchableOpacity style={styles.tab}>
//             <Text style={[styles.tabText, styles.activeTab]}>Reels</Text>
//             <View style={styles.activeIndicator} />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.tab}>
//             <Text style={styles.tabText}>Friends</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity 
//           style={styles.cameraButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    SINGLE REEL
// ====================================================== */
// const ReelItem = memo((props) => {
//   const {
//     item,
//     isActive,
//     isScreenFocused,
//     currentUserId,
//     bottomInset,
//     onLike,
//     onUserPress,
//     onCommentPress,
//     onSharePress,
//   } = props;

//   const videoRef = useRef(null);
//   const lastTap = useRef(0);
//   const timeoutRef = useRef(null);

//   const heartScale = useRef(new Animated.Value(0)).current;

//   const [paused, setPaused] = useState(false);
//   const [buffering, setBuffering] = useState(true);
//   const [loaded, setLoaded] = useState(false);

//   const isOwnReel =
//     currentUserId && item?.user?._id === currentUserId;

//   const shouldPlay =
//     isActive && isScreenFocused && !paused && loaded;

//   /* =========================
//      PLAY CONTROL
//   ========================= */
//   useEffect(() => {
//     const control = async () => {
//       try {
//         if (!videoRef.current) return;

//         if (shouldPlay) {
//           await videoRef.current.playAsync();
//         } else {
//           await videoRef.current.pauseAsync();
//         }
//       } catch {}
//     };

//     control();
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP
//   ========================= */
//   useEffect(() => {
//     return () => {
//       clearTimeout(timeoutRef.current);

//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET ON ITEM CHANGE
//   ========================= */
//   useEffect(() => {
//     setPaused(false);
//     setLoaded(false);
//     setBuffering(true);
//   }, [item?._id]);

//   /* =========================
//      TAP HANDLER
//   ========================= */
//   const handleTap = useCallback(() => {
//     const now = Date.now();
//     const delay = 300;

//     if (now - lastTap.current < delay) {
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       lastTap.current = now;

//       timeoutRef.current = setTimeout(() => {
//         if (lastTap.current !== 0) {
//           setPaused((p) => !p);
//         }
//       }, delay);
//     }
//   }, []);

//   /* =========================
//      DOUBLE TAP
//   ========================= */
//   const handleDoubleTap = () => {
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     if (!item?.isLiked) {
//       onLike(item._id);
//     }
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = useCallback((status) => {
//     if (status.isLoaded) {
//       setBuffering(status.isBuffering);
//     }

//     if (status.error) {
//       console.error('Video error:', status.error);
//     }
//   }, []);

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             isLooping
//             shouldPlay={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onLoad={() => setLoaded(true)}
//             onError={(e) => console.log(e)}
//           />

//           {buffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {paused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons
//                 name="play"
//                 size={60}
//                 color="rgba(255,255,255,0.8)"
//               />
//             </View>
//           )}

//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* ACTIONS - Right Side */}
//       <View
//         style={[
//           styles.actionsContainer,
//           { bottom: 120 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={32}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//         >
//           <Ionicons
//             name="chatbubble-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//         >
//           <Ionicons
//             name="paper-plane-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.sharesCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.actionButton}>
//           <Ionicons
//             name="ellipsis-vertical"
//             size={24}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* BOTTOM INFO */}
//       <View
//         style={[
//           styles.bottomOverlay,
//           { bottom: 60 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />

//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>

//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {!!item.caption && (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         )}

//         {/* Audio info - Instagram style */}
//         {item.audioName && (
//           <View style={styles.audioRow}>
//             <Ionicons name="musical-notes" size={14} color="#fff" />
//             <Text style={styles.audioText} numberOfLines={1}>
//               {item.audioName || 'Original audio'}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    MAIN SCREEN
// ====================================================== */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const isFocused = useIsFocused();

//   const { reels, loading, refreshing, pagination } =
//     useSelector((s) => s.reels);

//   const userId = useSelector(
//     (s) => s.auth.user?._id
//   );

//   const viewed = useRef(new Set());

//   const [index, setIndex] = useState(0);

//   /* LOAD */
//   useEffect(() => {
//     if (reels.length === 0) {
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch, reels.length]);

//   /* REFRESH ON FOCUS - to show newly uploaded reels */
//   useEffect(() => {
//     if (isFocused) {
//       // Refresh reels list when screen comes into focus
//       dispatch(fetchReels({ page: 1, refresh: true }));
//     }
//   }, [isFocused, dispatch]);

//   /* SYNC */
//   useEffect(() => {
//     dispatch(setCurrentIndex(index));
//   }, [index, dispatch]);

//   /* VIEW TRACK */
//   useEffect(() => {
//     if (!isFocused) return;

//     const reel = reels[index];

//     if (reel && !viewed.current.has(reel._id)) {
//       viewed.current.add(reel._id);
//       dispatch(trackReelView(reel._id));
//     }
//   }, [index, reels, isFocused, dispatch]);

//   /* HANDLERS */
//   const handleLike = useCallback(
//     (id) => dispatch(toggleReelLike(id)),
//     [dispatch]
//   );

//   const handleUser = useCallback(
//     (u) =>
//       u?._id &&
//       navigation.navigate(ROUTES.USER_PROFILE, {
//         userId: u._id,
//       }),
//     [navigation]
//   );

//   const handleComment = useCallback(
//     (id) =>
//       navigation.navigate(ROUTES.COMMENTS, {
//         reelId: id,
//         type: 'reel',
//       }),
//     [navigation]
//   );

//   const handleLoadMore = useCallback(() => {
//     if (
//       !refreshing &&
//       pagination.page < pagination.totalPages
//     ) {
//       dispatch(
//         fetchReels({ page: pagination.page + 1 })
//       );
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* VIEWABILITY */
//   const viewConfig = useRef({
//     itemVisiblePercentThreshold: 80,
//   }).current;

//   const onViewable = useRef(({ viewableItems }) => {
//     if (viewableItems[0]?.index != null) {
//       setIndex(viewableItems[0].index);
//     }
//   }).current;

//   /* RENDER */
//   const renderItem = useCallback(
//     ({ item, index: i }) => (
//       <ReelItem
//         item={item}
//         isActive={i === index}
//         isScreenFocused={isFocused}
//         currentUserId={userId}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUser}
//         onCommentPress={handleComment}
//         onSharePress={() => {}}
//       />
//     ),
//     [
//       index,
//       isFocused,
//       userId,
//       insets.bottom,
//       handleLike,
//       handleUser,
//       handleComment,
//     ]
//   );

//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator
//           size="large"
//           color={colors.primary}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
      
//       {/* Header */}
//       <ReelsHeader />

//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={(i) => i._id || Math.random()}
//         pagingEnabled
//         snapToInterval={SCREEN_HEIGHT}
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewable}
//         viewabilityConfig={viewConfig}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={
//           Platform.OS === 'android'
//         }
//         initialNumToRender={1}
//         windowSize={3}
//         maxToRenderPerBatch={2}
//         extraData={isFocused}
//         showsVerticalScrollIndicator={false}
//       />
//     </View>
//   );
// };

// /* ======================================================
//    STYLES
// ====================================================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* HEADER */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     backgroundColor: 'transparent',
//   },

//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//   },

//   plusButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   tabsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 24,
//   },

//   tab: {
//     paddingBottom: 4,
//     position: 'relative',
//   },

//   tabText: {
//     color: 'rgba(255, 255, 255, 0.6)',
//     fontSize: 17,
//     fontWeight: '600',
//   },

//   activeTab: {
//     color: '#fff',
//   },

//   activeIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 2,
//     backgroundColor: '#fff',
//     borderRadius: 1,
//   },

//   cameraButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* REEL */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//   },

//   videoWrapper: {
//     flex: 1,
//   },

//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* ACTIONS */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//     gap: 8,
//   },

//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },

//   actionText: {
//     color: '#fff',
//     fontSize: 13,
//     marginTop: 4,
//     fontWeight: '600',
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   avatarButton: {
//     marginTop: 8,
//   },

//   actionAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* BOTTOM INFO */
//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },

//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     marginRight: 10,
//   },

//   username: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   followButton: {
//     marginLeft: 10,
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     borderRadius: 6,
//   },

//   followText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 8,
//     lineHeight: 18,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },

//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '500',
//     flex: 1,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
// });

// export default ReelsScreen;









// import React, {
//   useState,
//   useCallback,
//   useRef,
//   useEffect,
//   memo,
// } from 'react';

// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
//   StatusBar,
//   RefreshControl,
// } from 'react-native';

// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
// } from '../../redux/slices/reelSlice';

// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// // NOTE: Make sure ROUTES.UPLOAD_REEL is defined in your routes.constants file
// // Example: export const ROUTES = { ..., UPLOAD_REEL: 'UploadReel', ... }

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
//   Dimensions.get('window');

// /* ======================================================
//    FORMAT COUNTS
// ====================================================== */
// const formatCount = (count = 0) => {
//   if (count < 1000) return String(count);

//   if (count >= 1_000_000) {
//     return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }

//   return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
// };

// /* ======================================================
//    HEADER COMPONENT
// ====================================================== */
// const ReelsHeader = memo(() => {
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();

//   const handleCreateReel = () => {
//     navigation.navigate(ROUTES.UPLOAD_REEL);
//   };

//   return (
//     <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//       <View style={styles.headerContent}>
//         <TouchableOpacity 
//           style={styles.plusButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="add-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         <View style={styles.tabsContainer}>
//           <TouchableOpacity style={styles.tab}>
//             <Text style={[styles.tabText, styles.activeTab]}>Reels</Text>
//             <View style={styles.activeIndicator} />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.tab}>
//             <Text style={styles.tabText}>Friends</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity 
//           style={styles.cameraButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    SINGLE REEL
// ====================================================== */
// const ReelItem = memo((props) => {
//   const {
//     item,
//     isActive,
//     isScreenFocused,
//     currentUserId,
//     bottomInset,
//     onLike,
//     onUserPress,
//     onCommentPress,
//     onSharePress,
//   } = props;

//   const videoRef = useRef(null);
//   const lastTap = useRef(0);
//   const timeoutRef = useRef(null);

//   const heartScale = useRef(new Animated.Value(0)).current;

//   const [paused, setPaused] = useState(false);
//   const [buffering, setBuffering] = useState(true);
//   const [loaded, setLoaded] = useState(false);

//   const isOwnReel =
//     currentUserId && item?.user?._id === currentUserId;

//   const shouldPlay =
//     isActive && isScreenFocused && !paused && loaded;

//   /* =========================
//      PLAY CONTROL
//   ========================= */
//   useEffect(() => {
//     const control = async () => {
//       try {
//         if (!videoRef.current) return;

//         if (shouldPlay) {
//           await videoRef.current.playAsync();
//         } else {
//           await videoRef.current.pauseAsync();
//         }
//       } catch {}
//     };

//     control();
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP
//   ========================= */
//   useEffect(() => {
//     return () => {
//       clearTimeout(timeoutRef.current);

//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET ON ITEM CHANGE
//   ========================= */
//   useEffect(() => {
//     setPaused(false);
//     setLoaded(false);
//     setBuffering(true);
//   }, [item?._id]);

//   /* =========================
//      TAP HANDLER
//   ========================= */
//   const handleTap = useCallback(() => {
//     const now = Date.now();
//     const delay = 300;

//     if (now - lastTap.current < delay) {
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       lastTap.current = now;

//       timeoutRef.current = setTimeout(() => {
//         if (lastTap.current !== 0) {
//           setPaused((p) => !p);
//         }
//       }, delay);
//     }
//   }, []);

//   /* =========================
//      DOUBLE TAP
//   ========================= */
//   const handleDoubleTap = () => {
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     if (!item?.isLiked) {
//       onLike(item._id);
//     }
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = useCallback((status) => {
//     if (status.isLoaded) {
//       setBuffering(status.isBuffering);
//     }

//     if (status.error) {
//       console.error('Video error:', status.error);
//     }
//   }, []);

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             isLooping
//             shouldPlay={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onLoad={() => setLoaded(true)}
//             onError={(e) => console.log(e)}
//           />

//           {buffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {paused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons
//                 name="play"
//                 size={60}
//                 color="rgba(255,255,255,0.8)"
//               />
//             </View>
//           )}

//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* ACTIONS - Right Side */}
//       <View
//         style={[
//           styles.actionsContainer,
//           { bottom: 120 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={32}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//         >
//           <Ionicons
//             name="chatbubble-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//         >
//           <Ionicons
//             name="paper-plane-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.sharesCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.actionButton}>
//           <Ionicons
//             name="ellipsis-vertical"
//             size={24}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* BOTTOM INFO */}
//       <View
//         style={[
//           styles.bottomOverlay,
//           { bottom: 60 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />

//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>

//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {!!item.caption && (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         )}

//         {/* Audio info - Instagram style */}
//         {item.audioName && (
//           <View style={styles.audioRow}>
//             <Ionicons name="musical-notes" size={14} color="#fff" />
//             <Text style={styles.audioText} numberOfLines={1}>
//               {item.audioName || 'Original audio'}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    MAIN SCREEN
// ====================================================== */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const isFocused = useIsFocused();

//   const { reels, loading, refreshing, pagination } =
//     useSelector((s) => s.reels);

//   const userId = useSelector(
//     (s) => s.auth.user?._id
//   );

//   const viewed = useRef(new Set());

//   const [index, setIndex] = useState(0);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   /* LOAD */
//   useEffect(() => {
//     if (reels.length === 0) {
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch, reels.length]);

//   /* REFRESH ON FOCUS - to show newly uploaded reels */
//   useEffect(() => {
//     if (isFocused) {
//       // Refresh reels list when screen comes into focus
//       dispatch(fetchReels({ page: 1, refresh: true }));
//     }
//   }, [isFocused, dispatch]);

//   /* SYNC */
//   useEffect(() => {
//     dispatch(setCurrentIndex(index));
//   }, [index, dispatch]);

//   /* VIEW TRACK */
//   useEffect(() => {
//     if (!isFocused) return;

//     const reel = reels[index];

//     if (reel && !viewed.current.has(reel._id)) {
//       viewed.current.add(reel._id);
//       dispatch(trackReelView(reel._id));
//     }
//   }, [index, reels, isFocused, dispatch]);

//   /* PULL TO REFRESH */
//   const handleRefresh = useCallback(async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchReels({ page: 1, refresh: true })).unwrap();
//       // Clear viewed set to allow retracking views
//       viewed.current.clear();
//     } catch (error) {
//       console.error('Refresh error:', error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   }, [dispatch]);

//   /* HANDLERS */
//   const handleLike = useCallback(
//     (id) => dispatch(toggleReelLike(id)),
//     [dispatch]
//   );

//   const handleUser = useCallback(
//     (u) =>
//       u?._id &&
//       navigation.navigate(ROUTES.USER_PROFILE, {
//         userId: u._id,
//       }),
//     [navigation]
//   );

//   const handleComment = useCallback(
//     (id) =>
//       navigation.navigate(ROUTES.COMMENTS, {
//         reelId: id,
//         type: 'reel',
//       }),
//     [navigation]
//   );

//   const handleLoadMore = useCallback(() => {
//     if (
//       !refreshing &&
//       pagination.page < pagination.totalPages
//     ) {
//       dispatch(
//         fetchReels({ page: pagination.page + 1 })
//       );
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* VIEWABILITY */
//   const viewConfig = useRef({
//     itemVisiblePercentThreshold: 80,
//   }).current;

//   const onViewable = useRef(({ viewableItems }) => {
//     if (viewableItems[0]?.index != null) {
//       setIndex(viewableItems[0].index);
//     }
//   }).current;

//   /* RENDER */
//   const renderItem = useCallback(
//     ({ item, index: i }) => (
//       <ReelItem
//         item={item}
//         isActive={i === index}
//         isScreenFocused={isFocused}
//         currentUserId={userId}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUser}
//         onCommentPress={handleComment}
//         onSharePress={() => {}}
//       />
//     ),
//     [
//       index,
//       isFocused,
//       userId,
//       insets.bottom,
//       handleLike,
//       handleUser,
//       handleComment,
//     ]
//   );

//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator
//           size="large"
//           color={colors.primary}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
      
//       {/* Header */}
//       <ReelsHeader />

//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={(i) => i._id || Math.random()}
//         pagingEnabled
//         snapToInterval={SCREEN_HEIGHT}
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewable}
//         viewabilityConfig={viewConfig}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={
//           Platform.OS === 'android'
//         }
//         initialNumToRender={1}
//         windowSize={3}
//         maxToRenderPerBatch={2}
//         extraData={isFocused}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefreshing}
//             onRefresh={handleRefresh}
//             tintColor="#fff"
//             colors={['#fff']}
//             progressBackgroundColor="rgba(0,0,0,0.5)"
//             title="Pull to refresh"
//             titleColor="#fff"
//           />
//         }
//       />
//     </View>
//   );
// };

// /* ======================================================
//    STYLES
// ====================================================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* HEADER */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     backgroundColor: 'transparent',
//   },

//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//   },

//   plusButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   tabsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 24,
//   },

//   tab: {
//     paddingBottom: 4,
//     position: 'relative',
//   },

//   tabText: {
//     color: 'rgba(255, 255, 255, 0.6)',
//     fontSize: 17,
//     fontWeight: '600',
//   },

//   activeTab: {
//     color: '#fff',
//   },

//   activeIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 2,
//     backgroundColor: '#fff',
//     borderRadius: 1,
//   },

//   cameraButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* REEL */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//   },

//   videoWrapper: {
//     flex: 1,
//   },

//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* ACTIONS */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//     gap: 8,
//   },

//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },

//   actionText: {
//     color: '#fff',
//     fontSize: 13,
//     marginTop: 4,
//     fontWeight: '600',
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   avatarButton: {
//     marginTop: 8,
//   },

//   actionAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* BOTTOM INFO */
//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },

//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     marginRight: 10,
//   },

//   username: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   followButton: {
//     marginLeft: 10,
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     borderRadius: 6,
//   },

//   followText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 8,
//     lineHeight: 18,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },

//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '500',
//     flex: 1,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
// });

// export default ReelsScreen;






// import React, {
//   useState,
//   useCallback,
//   useRef,
//   useEffect,
//   memo,
// } from 'react';

// import {
//   View,
//   Text,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   Animated,
//   Platform,
//   StatusBar,
//   RefreshControl,
//   Alert,
// } from 'react-native';

// import { Video, ResizeMode } from 'expo-av';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import {
//   fetchReels,
//   toggleReelLike,
//   trackReelView,
//   setCurrentIndex,
//   deleteReel,
//   hideReel,
//   reportReel,
// } from '../../redux/slices/reelSlice';

// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';
// import ReelOptionsSheet from './ReelOptionsSheet';
// // Or if you create a components folder: import ReelOptionsSheet from '../../components/Reels/ReelOptionsSheet';

// // NOTE: Make sure ROUTES.UPLOAD_REEL is defined in your routes.constants file
// // Example: export const ROUTES = { ..., UPLOAD_REEL: 'UploadReel', ... }

// const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
//   Dimensions.get('window');

// /* ======================================================
//    FORMAT COUNTS
// ====================================================== */
// const formatCount = (count = 0) => {
//   if (count < 1000) return String(count);

//   if (count >= 1_000_000) {
//     return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }

//   return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
// };

// /* ======================================================
//    HEADER COMPONENT
// ====================================================== */
// const ReelsHeader = memo(() => {
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();

//   const handleCreateReel = () => {
//     navigation.navigate(ROUTES.UPLOAD_REEL);
//   };

//   return (
//     <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//       <View style={styles.headerContent}>
//         <TouchableOpacity 
//           style={styles.plusButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="add-outline" size={28} color="#fff" />
//         </TouchableOpacity>

//         <View style={styles.tabsContainer}>
//           <TouchableOpacity style={styles.tab}>
//             <Text style={[styles.tabText, styles.activeTab]}>Reels</Text>
//             <View style={styles.activeIndicator} />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.tab}>
//             <Text style={styles.tabText}>Friends</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity 
//           style={styles.cameraButton}
//           onPress={handleCreateReel}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="camera-outline" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    SINGLE REEL
// ====================================================== */
// const ReelItem = memo((props) => {
//   const {
//     item,
//     isActive,
//     isScreenFocused,
//     currentUserId,
//     bottomInset,
//     onLike,
//     onUserPress,
//     onCommentPress,
//     onSharePress,
//     onOptionsPress,
//   } = props;

//   const videoRef = useRef(null);
//   const lastTap = useRef(0);
//   const timeoutRef = useRef(null);

//   const heartScale = useRef(new Animated.Value(0)).current;

//   const [paused, setPaused] = useState(false);
//   const [buffering, setBuffering] = useState(true);
//   const [loaded, setLoaded] = useState(false);

//   const isOwnReel =
//     currentUserId && item?.user?._id === currentUserId;

//   const shouldPlay =
//     isActive && isScreenFocused && !paused && loaded;

//   /* =========================
//      PLAY CONTROL
//   ========================= */
//   useEffect(() => {
//     const control = async () => {
//       try {
//         if (!videoRef.current) return;

//         if (shouldPlay) {
//           await videoRef.current.playAsync();
//         } else {
//           await videoRef.current.pauseAsync();
//         }
//       } catch {}
//     };

//     control();
//   }, [shouldPlay]);

//   /* =========================
//      CLEANUP
//   ========================= */
//   useEffect(() => {
//     return () => {
//       clearTimeout(timeoutRef.current);

//       if (videoRef.current) {
//         videoRef.current.pauseAsync().catch(() => {});
//         videoRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   /* =========================
//      RESET ON ITEM CHANGE
//   ========================= */
//   useEffect(() => {
//     setPaused(false);
//     setLoaded(false);
//     setBuffering(true);
//   }, [item?._id]);

//   /* =========================
//      TAP HANDLER
//   ========================= */
//   const handleTap = useCallback(() => {
//     const now = Date.now();
//     const delay = 300;

//     if (now - lastTap.current < delay) {
//       handleDoubleTap();
//       lastTap.current = 0;
//     } else {
//       lastTap.current = now;

//       timeoutRef.current = setTimeout(() => {
//         if (lastTap.current !== 0) {
//           setPaused((p) => !p);
//         }
//       }, delay);
//     }
//   }, []);

//   /* =========================
//      DOUBLE TAP
//   ========================= */
//   const handleDoubleTap = () => {
//     Animated.sequence([
//       Animated.spring(heartScale, {
//         toValue: 1,
//         useNativeDriver: true,
//       }),
//       Animated.timing(heartScale, {
//         toValue: 0,
//         duration: 400,
//         delay: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     if (!item?.isLiked) {
//       onLike(item._id);
//     }
//   };

//   /* =========================
//      PLAYBACK STATUS
//   ========================= */
//   const onPlaybackStatusUpdate = useCallback((status) => {
//     if (status.isLoaded) {
//       setBuffering(status.isBuffering);
//     }

//     if (status.error) {
//       console.error('Video error:', status.error);
//     }
//   }, []);

//   return (
//     <View style={styles.reelContainer}>
//       <TouchableWithoutFeedback onPress={handleTap}>
//         <View style={styles.videoWrapper}>
//           <Video
//             ref={videoRef}
//             source={{ uri: item.videoUrl }}
//             style={styles.video}
//             resizeMode={ResizeMode.COVER}
//             isLooping
//             shouldPlay={false}
//             onPlaybackStatusUpdate={onPlaybackStatusUpdate}
//             onLoad={() => setLoaded(true)}
//             onError={(e) => console.log(e)}
//           />

//           {buffering && isActive && (
//             <View style={styles.bufferingContainer}>
//               <ActivityIndicator size="large" color="#fff" />
//             </View>
//           )}

//           {paused && (
//             <View style={styles.pausedContainer}>
//               <Ionicons
//                 name="play"
//                 size={60}
//                 color="rgba(255,255,255,0.8)"
//               />
//             </View>
//           )}

//           <Animated.View
//             style={[
//               styles.doubleTapHeart,
//               {
//                 transform: [{ scale: heartScale }],
//                 opacity: heartScale,
//               },
//             ]}
//           >
//             <Ionicons name="heart" size={100} color="#FF3B30" />
//           </Animated.View>
//         </View>
//       </TouchableWithoutFeedback>

//       {/* ACTIONS - Right Side */}
//       <View
//         style={[
//           styles.actionsContainer,
//           { bottom: 120 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onLike(item._id)}
//         >
//           <Ionicons
//             name={item.isLiked ? 'heart' : 'heart-outline'}
//             size={32}
//             color={item.isLiked ? '#FF3B30' : '#fff'}
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.likesCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onCommentPress(item._id)}
//         >
//           <Ionicons
//             name="chatbubble-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.commentsCount)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onSharePress(item)}
//         >
//           <Ionicons
//             name="paper-plane-outline"
//             size={30}
//             color="#fff"
//           />
//           <Text style={styles.actionText}>
//             {formatCount(item.sharesCount || 0)}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onOptionsPress(item)}
//         >
//           <Ionicons
//             name="ellipsis-vertical"
//             size={24}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.avatarButton}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.actionAvatar}
//           />
//         </TouchableOpacity>
//       </View>

//       {/* BOTTOM INFO */}
//       <View
//         style={[
//           styles.bottomOverlay,
//           { bottom: 60 + bottomInset },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.userRow}
//           onPress={() => onUserPress(item.user)}
//         >
//           <Image
//             source={{
//               uri:
//                 item.user?.profilePicture ||
//                 'https://via.placeholder.com/150',
//             }}
//             style={styles.avatar}
//           />

//           <Text style={styles.username}>
//             {item.user?.username || 'user'}
//           </Text>

//           {!isOwnReel && (
//             <TouchableOpacity style={styles.followButton}>
//               <Text style={styles.followText}>Follow</Text>
//             </TouchableOpacity>
//           )}
//         </TouchableOpacity>

//         {!!item.caption && (
//           <Text style={styles.caption} numberOfLines={2}>
//             {item.caption}
//           </Text>
//         )}

//         {/* Audio info - Instagram style */}
//         {item.audioName && (
//           <View style={styles.audioRow}>
//             <Ionicons name="musical-notes" size={14} color="#fff" />
//             <Text style={styles.audioText} numberOfLines={1}>
//               {item.audioName || 'Original audio'}
//             </Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// });

// /* ======================================================
//    MAIN SCREEN
// ====================================================== */
// const ReelsScreen = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const isFocused = useIsFocused();

//   const { reels, loading, refreshing, pagination } =
//     useSelector((s) => s.reels);

//   const userId = useSelector(
//     (s) => s.auth.user?._id
//   );

//   const viewed = useRef(new Set());

//   const [index, setIndex] = useState(0);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [showOptionsSheet, setShowOptionsSheet] = useState(false);
//   const [selectedReel, setSelectedReel] = useState(null);

//   /* LOAD */
//   useEffect(() => {
//     if (reels.length === 0) {
//       dispatch(fetchReels({ page: 1 }));
//     }
//   }, [dispatch, reels.length]);

//   /* REFRESH ON FOCUS - to show newly uploaded reels */
//   useEffect(() => {
//     if (isFocused) {
//       // Refresh reels list when screen comes into focus
//       dispatch(fetchReels({ page: 1, refresh: true }));
//     }
//   }, [isFocused, dispatch]);

//   /* SYNC */
//   useEffect(() => {
//     dispatch(setCurrentIndex(index));
//   }, [index, dispatch]);

//   /* VIEW TRACK */
//   useEffect(() => {
//     if (!isFocused) return;

//     const reel = reels[index];

//     if (reel && !viewed.current.has(reel._id)) {
//       viewed.current.add(reel._id);
//       dispatch(trackReelView(reel._id));
//     }
//   }, [index, reels, isFocused, dispatch]);

//   /* PULL TO REFRESH */
//   const handleRefresh = useCallback(async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchReels({ page: 1, refresh: true })).unwrap();
//       // Clear viewed set to allow retracking views
//       viewed.current.clear();
//     } catch (error) {
//       console.error('Refresh error:', error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   }, [dispatch]);

//   /* OPTIONS SHEET HANDLERS */
//   const handleOptionsPress = useCallback((reel) => {
//     setSelectedReel(reel);
//     setShowOptionsSheet(true);
//   }, []);

//   const handleCloseOptions = useCallback(() => {
//     setShowOptionsSheet(false);
//     setTimeout(() => setSelectedReel(null), 300);
//   }, []);

//   const handleDeleteReel = useCallback(async () => {
//     if (!selectedReel?._id) return;

//     try {
//       await dispatch(deleteReel(selectedReel._id)).unwrap();
//       Alert.alert('Success', 'Reel deleted successfully');
//       // Refresh the list
//       await dispatch(fetchReels({ page: 1, refresh: true }));
//     } catch (error) {
//       console.error('Delete error:', error);
//       Alert.alert('Error', 'Failed to delete reel. Please try again.');
//     }
//   }, [selectedReel, dispatch]);

//   const handleReportReel = useCallback(async (reason) => {
//     if (!selectedReel?._id) return;

//     try {
//       await dispatch(reportReel({ reelId: selectedReel._id, reason })).unwrap();
//       Alert.alert('Thank you', 'We\'ve received your report and will review it shortly.');
//     } catch (error) {
//       console.error('Report error:', error);
//       Alert.alert('Error', 'Failed to report reel. Please try again.');
//     }
//   }, [selectedReel, dispatch]);

//   const handleHideReel = useCallback(async () => {
//     if (!selectedReel?._id) return;

//     try {
//       await dispatch(hideReel(selectedReel._id)).unwrap();
//       Alert.alert('Hidden', 'You won\'t see posts like this in your feed.');
//       // Refresh the list
//       await dispatch(fetchReels({ page: 1, refresh: true }));
//     } catch (error) {
//       console.error('Hide error:', error);
//       Alert.alert('Error', 'Failed to hide reel. Please try again.');
//     }
//   }, [selectedReel, dispatch]);

//   const handleUnfollowUser = useCallback(async () => {
//     if (!selectedReel?.user?._id) return;

//     try {
//       // You'll need to implement this action
//       // await dispatch(unfollowUser(selectedReel.user._id)).unwrap();
//       Alert.alert('Success', `You unfollowed @${selectedReel.user.username}`);
//       // Refresh the list
//       await dispatch(fetchReels({ page: 1, refresh: true }));
//     } catch (error) {
//       console.error('Unfollow error:', error);
//       Alert.alert('Error', 'Failed to unfollow. Please try again.');
//     }
//   }, [selectedReel, dispatch]);

//   const handleCopyLink = useCallback(() => {
//     if (!selectedReel?._id) return;
    
//     // Copy link logic - you'll need to implement based on your app's URL scheme
//     const link = `yourapp://reel/${selectedReel._id}`;
//     // Clipboard.setString(link);
//     Alert.alert('Link copied', 'Reel link copied to clipboard');
//   }, [selectedReel]);

//   const handleShareReel = useCallback(() => {
//     if (!selectedReel) return;
    
//     // Share logic - already implemented in your code
//     // This can use React Native's Share API
//     Alert.alert('Share', 'Share functionality');
//   }, [selectedReel]);

//   /* HANDLERS */
//   const handleLike = useCallback(
//     (id) => dispatch(toggleReelLike(id)),
//     [dispatch]
//   );

//   const handleUser = useCallback(
//     (u) =>
//       u?._id &&
//       navigation.navigate(ROUTES.USER_PROFILE, {
//         userId: u._id,
//       }),
//     [navigation]
//   );

//   const handleComment = useCallback(
//     (id) =>
//       navigation.navigate(ROUTES.COMMENTS, {
//         reelId: id,
//         type: 'reel',
//       }),
//     [navigation]
//   );

//   const handleLoadMore = useCallback(() => {
//     if (
//       !refreshing &&
//       pagination.page < pagination.totalPages
//     ) {
//       dispatch(
//         fetchReels({ page: pagination.page + 1 })
//       );
//     }
//   }, [dispatch, refreshing, pagination]);

//   /* VIEWABILITY */
//   const viewConfig = useRef({
//     itemVisiblePercentThreshold: 80,
//   }).current;

//   const onViewable = useRef(({ viewableItems }) => {
//     if (viewableItems[0]?.index != null) {
//       setIndex(viewableItems[0].index);
//     }
//   }).current;

//   /* RENDER */
//   const renderItem = useCallback(
//     ({ item, index: i }) => (
//       <ReelItem
//         item={item}
//         isActive={i === index}
//         isScreenFocused={isFocused}
//         currentUserId={userId}
//         bottomInset={insets.bottom}
//         onLike={handleLike}
//         onUserPress={handleUser}
//         onCommentPress={handleComment}
//         onSharePress={() => {}}
//         onOptionsPress={handleOptionsPress}
//       />
//     ),
//     [
//       index,
//       isFocused,
//       userId,
//       insets.bottom,
//       handleLike,
//       handleUser,
//       handleComment,
//       handleOptionsPress,
//     ]
//   );

//   if (loading && reels.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator
//           size="large"
//           color={colors.primary}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
      
//       {/* Header */}
//       <ReelsHeader />

//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={(i) => i._id || Math.random()}
//         pagingEnabled
//         snapToInterval={SCREEN_HEIGHT}
//         decelerationRate="fast"
//         onViewableItemsChanged={onViewable}
//         viewabilityConfig={viewConfig}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.5}
//         removeClippedSubviews={
//           Platform.OS === 'android'
//         }
//         initialNumToRender={1}
//         windowSize={3}
//         maxToRenderPerBatch={2}
//         extraData={isFocused}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefreshing}
//             onRefresh={handleRefresh}
//             tintColor="#fff"
//             colors={['#fff']}
//             progressBackgroundColor="rgba(0,0,0,0.5)"
//             title="Pull to refresh"
//             titleColor="#fff"
//           />
//         }
//       />

//       {/* Options Bottom Sheet */}
//       <ReelOptionsSheet
//         visible={showOptionsSheet}
//         onClose={handleCloseOptions}
//         isOwnReel={selectedReel?.user?._id === userId}
//         username={selectedReel?.user?.username || 'user'}
//         onDelete={handleDeleteReel}
//         onReport={handleReportReel}
//         onHide={handleHideReel}
//         onUnfollow={handleUnfollowUser}
//         onCopyLink={handleCopyLink}
//         onShare={handleShareReel}
//       />
//     </View>
//   );
// };

// /* ======================================================
//    STYLES
// ====================================================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },

//   /* HEADER */
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     backgroundColor: 'transparent',
//   },

//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//   },

//   plusButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   tabsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 24,
//   },

//   tab: {
//     paddingBottom: 4,
//     position: 'relative',
//   },

//   tabText: {
//     color: 'rgba(255, 255, 255, 0.6)',
//     fontSize: 17,
//     fontWeight: '600',
//   },

//   activeTab: {
//     color: '#fff',
//   },

//   activeIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 2,
//     backgroundColor: '#fff',
//     borderRadius: 1,
//   },

//   cameraButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* REEL */
//   reelContainer: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     backgroundColor: '#000',
//   },

//   videoWrapper: {
//     flex: 1,
//   },

//   video: {
//     width: '100%',
//     height: '100%',
//   },

//   bufferingContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   pausedContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   doubleTapHeart: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     marginLeft: -50,
//     marginTop: -50,
//   },

//   /* ACTIONS */
//   actionsContainer: {
//     position: 'absolute',
//     right: 12,
//     alignItems: 'center',
//     gap: 8,
//   },

//   actionButton: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },

//   actionText: {
//     color: '#fff',
//     fontSize: 13,
//     marginTop: 4,
//     fontWeight: '600',
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   avatarButton: {
//     marginTop: 8,
//   },

//   actionAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },

//   /* BOTTOM INFO */
//   bottomOverlay: {
//     position: 'absolute',
//     left: 16,
//     right: 80,
//   },

//   userRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },

//   avatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     marginRight: 10,
//   },

//   username: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   followButton: {
//     marginLeft: 10,
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderWidth: 1.5,
//     borderColor: '#fff',
//     borderRadius: 6,
//   },

//   followText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   caption: {
//     color: '#fff',
//     fontSize: 14,
//     marginBottom: 8,
//     lineHeight: 18,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   audioRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },

//   audioText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '500',
//     flex: 1,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
// });

// export default ReelsScreen;









import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';

import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchReels,
  toggleReelLike,
  trackReelView,
  setCurrentIndex,
  deleteReel,
  hideReel,
  reportReel,
} from '../../redux/slices/reelSlice';

import { toggleFollow } from '../../redux/slices/followSlice';

import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';
import ReelOptionsSheet from './ReelOptionsSheet';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
  Dimensions.get('window');

/* ======================================================
   FORMAT COUNTS
====================================================== */
const formatCount = (count = 0) => {
  if (count < 1000) return String(count);

  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }

  return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
};

/* ======================================================
   HEADER COMPONENT
====================================================== */
const ReelsHeader = memo(() => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleCreateReel = () => {
    navigation.navigate(ROUTES.UPLOAD_REEL);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.plusButton}
          onPress={handleCreateReel}
          activeOpacity={0.7}
        >
          <Ionicons name="add-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tab}>
            <Text style={[styles.tabText, styles.activeTab]}>Reels</Text>
            <View style={styles.activeIndicator} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Friends</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={handleCreateReel}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ======================================================
   SINGLE REEL
====================================================== */
const ReelItem = memo((props) => {
  const {
    item,
    isActive,
    isScreenFocused,
    currentUserId,
    bottomInset,
    onLike,
    onUserPress,
    onCommentPress,
    onSharePress,
    onOptionsPress,
    onFollowPress,
  } = props;

  const videoRef = useRef(null);
  const lastTap = useRef(0);
  const timeoutRef = useRef(null);

  const heartScale = useRef(new Animated.Value(0)).current;

  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const isOwnReel =
    currentUserId && item?.user?._id === currentUserId;

  const shouldPlay =
    isActive && isScreenFocused && !paused && loaded;

  /* =========================
     PLAY CONTROL
  ========================= */
  useEffect(() => {
    const control = async () => {
      try {
        if (!videoRef.current) return;

        if (shouldPlay) {
          await videoRef.current.playAsync();
        } else {
          await videoRef.current.pauseAsync();
        }
      } catch {}
    };

    control();
  }, [shouldPlay]);

  /* =========================
     CLEANUP
  ========================= */
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);

      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  /* =========================
     RESET ON ITEM CHANGE
  ========================= */
  useEffect(() => {
    setPaused(false);
    setLoaded(false);
    setBuffering(true);
  }, [item?._id]);

  /* =========================
     TAP HANDLER
  ========================= */
  const handleTap = useCallback(() => {
    const now = Date.now();
    const delay = 300;

    if (now - lastTap.current < delay) {
      handleDoubleTap();
      lastTap.current = 0;
    } else {
      lastTap.current = now;

      timeoutRef.current = setTimeout(() => {
        if (lastTap.current !== 0) {
          setPaused((p) => !p);
        }
      }, delay);
    }
  }, []);

  /* =========================
     DOUBLE TAP
  ========================= */
  const handleDoubleTap = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (!item?.isLiked) {
      onLike(item._id);
    }
  };

  /* =========================
     PLAYBACK STATUS
  ========================= */
  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) {
      setBuffering(status.isBuffering);
    }

    if (status.error) {
      console.error('Video error:', status.error);
    }
  }, []);

  return (
    <View style={styles.reelContainer}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onLoad={() => setLoaded(true)}
            onError={(e) => console.log(e)}
          />

          {buffering && isActive && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {paused && (
            <View style={styles.pausedContainer}>
              <Ionicons
                name="play"
                size={60}
                color="rgba(255,255,255,0.8)"
              />
            </View>
          )}

          <Animated.View
            style={[
              styles.doubleTapHeart,
              {
                transform: [{ scale: heartScale }],
                opacity: heartScale,
              },
            ]}
          >
            <Ionicons name="heart" size={100} color="#FF3B30" />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* ACTIONS - Right Side */}
      <View
        style={[
          styles.actionsContainer,
          { bottom: 120 + bottomInset },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(item._id)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={item.isLiked ? '#FF3B30' : '#fff'}
          />
          <Text style={styles.actionText}>
            {formatCount(item.likesCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onCommentPress(item._id)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={30}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {formatCount(item.commentsCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSharePress(item)}
        >
          <Ionicons
            name="paper-plane-outline"
            size={30}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {formatCount(item.sharesCount || 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onOptionsPress(item)}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => onUserPress(item.user)}
        >
          <Image
            source={{
              uri:
                item.user?.profilePicture ||
                'https://via.placeholder.com/150',
            }}
            style={styles.actionAvatar}
          />
        </TouchableOpacity>
      </View>

      {/* BOTTOM INFO */}
      <View
        style={[
          styles.bottomOverlay,
          { bottom: 60 + bottomInset },
        ]}
      >
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => onUserPress(item.user)}
        >
          <Image
            source={{
              uri:
                item.user?.profilePicture ||
                'https://via.placeholder.com/150',
            }}
            style={styles.avatar}
          />

          <Text style={styles.username}>
            {item.user?.username || 'user'}
          </Text>

          {/* UPDATED FOLLOW BUTTON LOGIC */}
          {!isOwnReel && !item.user?.isFollowing && (
            <TouchableOpacity 
              style={styles.followButton}
              onPress={() => onFollowPress(item.user)}
            >
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {!!item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}

        {/* Audio info - Instagram style */}
        {item.audioName && (
          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={14} color="#fff" />
            <Text style={styles.audioText} numberOfLines={1}>
              {item.audioName || 'Original audio'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

/* ======================================================
   MAIN SCREEN
====================================================== */
const ReelsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const isFocused = useIsFocused();

  const { reels, loading, refreshing, pagination } =
    useSelector((s) => s.reels);

  const userId = useSelector(
    (s) => s.auth.user?._id
  );

  const viewed = useRef(new Set());

  const [index, setIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);

  /* LOAD */
  useEffect(() => {
    if (reels.length === 0) {
      dispatch(fetchReels({ page: 1 }));
    }
  }, [dispatch, reels.length]);

  /* REFRESH ON FOCUS - to show newly uploaded reels */
  useEffect(() => {
    if (isFocused) {
      // Refresh reels list when screen comes into focus
      dispatch(fetchReels({ page: 1, refresh: true }));
    }
  }, [isFocused, dispatch]);

  /* SYNC */
  useEffect(() => {
    dispatch(setCurrentIndex(index));
  }, [index, dispatch]);

  /* VIEW TRACK */
  useEffect(() => {
    if (!isFocused) return;

    const reel = reels[index];

    if (reel && !viewed.current.has(reel._id)) {
      viewed.current.add(reel._id);
      dispatch(trackReelView(reel._id));
    }
  }, [index, reels, isFocused, dispatch]);

  /* PULL TO REFRESH */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchReels({ page: 1, refresh: true })).unwrap();
      // Clear viewed set to allow retracking views
      viewed.current.clear();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  /* FOLLOW USER */
  const handleFollowUser = useCallback(async (user) => {
    if (!user?._id) return;

    try {
      await dispatch(toggleFollow(user._id)).unwrap();
      // Success - no need to show alert, button will disappear
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to follow user. Please try again.');
    }
  }, [dispatch]);

  /* OPTIONS SHEET HANDLERS */
  const handleOptionsPress = useCallback((reel) => {
    setSelectedReel(reel);
    setShowOptionsSheet(true);
  }, []);

  const handleCloseOptions = useCallback(() => {
    setShowOptionsSheet(false);
    setTimeout(() => setSelectedReel(null), 300);
  }, []);

  const handleDeleteReel = useCallback(async () => {
    if (!selectedReel?._id) return;

    try {
      await dispatch(deleteReel(selectedReel._id)).unwrap();
      Alert.alert('Success', 'Reel deleted successfully');
      // Refresh the list
      await dispatch(fetchReels({ page: 1, refresh: true }));
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete reel. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleReportReel = useCallback(async (reason) => {
    if (!selectedReel?._id) return;

    try {
      await dispatch(reportReel({ reelId: selectedReel._id, reason })).unwrap();
      Alert.alert('Thank you', 'We\'ve received your report and will review it shortly.');
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Error', 'Failed to report reel. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleHideReel = useCallback(async () => {
    if (!selectedReel?._id) return;

    try {
      await dispatch(hideReel(selectedReel._id)).unwrap();
      Alert.alert('Hidden', 'You won\'t see posts like this in your feed.');
      // Refresh the list
      await dispatch(fetchReels({ page: 1, refresh: true }));
    } catch (error) {
      console.error('Hide error:', error);
      Alert.alert('Error', 'Failed to hide reel. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleUnfollowUser = useCallback(async () => {
    if (!selectedReel?.user?._id) return;

    try {
      await dispatch(toggleFollow(selectedReel.user._id)).unwrap();
      Alert.alert('Success', `You unfollowed @${selectedReel.user.username}`);
      // Refresh the list
      await dispatch(fetchReels({ page: 1, refresh: true }));
    } catch (error) {
      console.error('Unfollow error:', error);
      Alert.alert('Error', 'Failed to unfollow. Please try again.');
    }
  }, [selectedReel, dispatch]);

  const handleCopyLink = useCallback(() => {
    if (!selectedReel?._id) return;
    
    // Copy link logic - you'll need to implement based on your app's URL scheme
    const link = `yourapp://reel/${selectedReel._id}`;
    // Clipboard.setString(link);
    Alert.alert('Link copied', 'Reel link copied to clipboard');
  }, [selectedReel]);

  const handleShareReel = useCallback(() => {
    if (!selectedReel) return;
    
    // Share logic - already implemented in your code
    // This can use React Native's Share API
    Alert.alert('Share', 'Share functionality');
  }, [selectedReel]);

  /* HANDLERS */
  const handleLike = useCallback(
    (id) => dispatch(toggleReelLike(id)),
    [dispatch]
  );

  const handleUser = useCallback(
    (u) =>
      u?._id &&
      navigation.navigate(ROUTES.USER_PROFILE, {
        userId: u._id,
      }),
    [navigation]
  );

  const handleComment = useCallback(
    (id) =>
      navigation.navigate(ROUTES.COMMENTS, {
        reelId: id,
        type: 'reel',
      }),
    [navigation]
  );

  const handleLoadMore = useCallback(() => {
    if (
      !refreshing &&
      pagination.page < pagination.totalPages
    ) {
      dispatch(
        fetchReels({ page: pagination.page + 1 })
      );
    }
  }, [dispatch, refreshing, pagination]);

  /* VIEWABILITY */
  const viewConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewable = useRef(({ viewableItems }) => {
    if (viewableItems[0]?.index != null) {
      setIndex(viewableItems[0].index);
    }
  }).current;

  /* RENDER */
  const renderItem = useCallback(
    ({ item, index: i }) => (
      <ReelItem
        item={item}
        isActive={i === index}
        isScreenFocused={isFocused}
        currentUserId={userId}
        bottomInset={insets.bottom}
        onLike={handleLike}
        onUserPress={handleUser}
        onCommentPress={handleComment}
        onSharePress={() => {}}
        onOptionsPress={handleOptionsPress}
        onFollowPress={handleFollowUser}
      />
    ),
    [
      index,
      isFocused,
      userId,
      insets.bottom,
      handleLike,
      handleUser,
      handleComment,
      handleOptionsPress,
      handleFollowUser,
    ]
  );

  if (loading && reels.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <ReelsHeader />

      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={(i) => i._id || Math.random()}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewConfig}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={
          Platform.OS === 'android'
        }
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        extraData={isFocused}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={['#fff']}
            progressBackgroundColor="rgba(0,0,0,0.5)"
            title="Pull to refresh"
            titleColor="#fff"
          />
        }
      />

      {/* Options Bottom Sheet */}
      <ReelOptionsSheet
        visible={showOptionsSheet}
        onClose={handleCloseOptions}
        isOwnReel={selectedReel?.user?._id === userId}
        username={selectedReel?.user?.username || 'user'}
        onDelete={handleDeleteReel}
        onReport={handleReportReel}
        onHide={handleHideReel}
        onUnfollow={handleUnfollowUser}
        onCopyLink={handleCopyLink}
        onShare={handleShareReel}
      />
    </View>
  );
};

/* ======================================================
   STYLES
====================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  /* HEADER */
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  plusButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },

  tab: {
    paddingBottom: 4,
    position: 'relative',
  },

  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 17,
    fontWeight: '600',
  },

  activeTab: {
    color: '#fff',
  },

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },

  cameraButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* REEL */
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },

  videoWrapper: {
    flex: 1,
  },

  video: {
    width: '100%',
    height: '100%',
  },

  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pausedContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
  },

  /* ACTIONS */
  actionsContainer: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 8,
  },

  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },

  actionText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  avatarButton: {
    marginTop: 8,
  },

  actionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },

  /* BOTTOM INFO */
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 80,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
    marginRight: 10,
  },

  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  followButton: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 6,
  },

  followText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  caption: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },

  audioText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default ReelsScreen;