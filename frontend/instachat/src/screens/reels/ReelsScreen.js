// // import React, { useEffect, useState } from 'react';
// // import { View, Text, FlatList, Dimensions, StyleSheet } from 'react-native';
// // import { Video } from 'expo-av';
// // import { getFeed } from '../../api/Posts.api';

// // const { height, width } = Dimensions.get('window');

// // const ReelsScreen = () => {
// //   const [reels, setReels] = useState([]);

// //   useEffect(() => {
// //     fetchReels();
// //   }, []);

// //   const fetchReels = async () => {
// //     try {
// //       const data = await getFeed();
// //       setReels(data.data || []); 
// //     } catch (e) {
// //       console.log(e);
// //     }
// //   };

// //   const renderItem = ({ item }) => (
// //     <View style={styles.reelContainer}>
// //       <Video
// //         source={{ uri: item.videoUrl }}
// //         style={styles.video}
// //         resizeMode="cover"
// //         isLooping
// //         shouldPlay={true}
// //         isMuted={true} // Muted initially to prevent blast
// //       />
// //       <View style={styles.overlay}>
// //          <Text style={styles.username}>@{item.uploader?.username}</Text>
// //          <Text style={styles.caption}>{item.caption}</Text>
// //       </View>
// //     </View>
// //   );

// //   return (
// //     <FlatList
// //       data={reels}
// //       renderItem={renderItem}
// //       keyExtractor={item => item._id}
// //       pagingEnabled
// //       vertical
// //       showsVerticalScrollIndicator={false}
// //       snapToInterval={height}
// //       snapToAlignment="start"
// //       decelerationRate="fast"
// //     />
// //   );
// // };

// // const styles = StyleSheet.create({
// //   reelContainer: { width: width, height: height, backgroundColor: 'black' },
// //   video: { width: '100%', height: '100%' },
// //   overlay: { position: 'absolute', bottom: 100, left: 20 },
// //   username: { color: 'white', fontWeight: 'bold', fontSize: 16 },
// //   caption: { color: 'white', marginTop: 5 }
// // });

// // export default ReelsScreen;



// import React, { useState, useCallback } from 'react';
// import { View, Text, FlatList, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import { useFocusEffect } from '@react-navigation/native'; // <--- NEW IMPORT
// import { getFeed } from '../../api/Posts.api';
// import colors from '../../theme/colors';

// const { height, width } = Dimensions.get('window');

// const ReelsScreen = () => {
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // 1. Fetch Reels whenever this screen is focused (opened)
//   useFocusEffect(
//     useCallback(() => {
//       fetchReels();
//     }, [])
//   );

//   const fetchReels = async () => {
//     try {
//       const response = await getFeed();
//       console.log("📥 Reels Data:", JSON.stringify(response.data, null, 2)); // DEBUG LOG
//       setReels(response.data || []);
//     } catch (e) {
//       console.error("❌ Error fetching reels:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 2. Render each Reel
//   const renderItem = ({ item }) => {
//     return (
//       <View style={styles.reelContainer}>
//         <Video
//           source={{ uri: item.videoUrl }} // Ensure backend sends 'videoUrl'
//           style={styles.video}
//           resizeMode={ResizeMode.COVER}
//           shouldPlay={true}
//           isLooping
//           isMuted={false} 
//         />
        
//         {/* Overlay Info */}
//         <View style={styles.overlay}>
//           <View style={styles.userInfo}>
//              {/* Fallback if user data is missing */}
//              <View style={styles.avatarPlaceholder} />
//              <Text style={styles.username}>@{item.uploader?.username || "User"}</Text>
//           </View>
//           <Text style={styles.caption}>{item.caption}</Text>
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
//   }

//   if (reels.length === 0) {
//      return (
//        <View style={styles.center}>
//          <Text style={{color: 'white'}}>No Reels yet. Upload one!</Text>
//        </View>
//      );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={item => item._id}
//         pagingEnabled
//         vertical
//         showsVerticalScrollIndicator={false}
//         snapToInterval={height} // Full screen snap
//         snapToAlignment="start"
//         decelerationRate="fast"
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'black' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
//   reelContainer: { width: width, height: height, position: 'relative' },
//   video: { width: '100%', height: '100%' },
  
//   overlay: { position: 'absolute', bottom: 100, left: 20, right: 20 },
//   userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
//   avatarPlaceholder: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc', marginRight: 10 },
//   username: { color: 'white', fontWeight: 'bold', fontSize: 16 },
//   caption: { color: 'white', fontSize: 14 }
// });

// export default ReelsScreen;







// import React, { useState, useCallback } from 'react';
// import { View, Text, FlatList, Dimensions, StyleSheet, ActivityIndicator, Image } from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import { useFocusEffect } from '@react-navigation/native';
// import { getFeed } from '../../api/Posts.api';
// import colors from '../../theme/colors';

// const { height, width } = Dimensions.get('window');

// const ReelsScreen = () => {
//   const [reels, setReels] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // 1. Fetch Reels whenever this screen is focused (opened)
//   useFocusEffect(
//     useCallback(() => {
//       fetchReels();
//     }, [])
//   );

//   const fetchReels = async () => {
//     try {
//       const response = await getFeed();
//       // Debug log to check if profilePicture is coming from backend
//       console.log("📥 Reels Data:", JSON.stringify(response.data?.[0]?.uploader, null, 2)); 
//       setReels(response.data || []);
//     } catch (e) {
//       console.error("❌ Error fetching reels:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 2. Render each Reel
//   const renderItem = ({ item }) => {
//     return (
//       <View style={styles.reelContainer}>
//         <Video
//           source={{ uri: item.videoUrl }} 
//           style={styles.video}
//           resizeMode={ResizeMode.COVER}
//           shouldPlay={true}
//           isLooping
//           isMuted={false} 
//         />
        
//         {/* Overlay Info */}
//         <View style={styles.overlay}>
//           <View style={styles.userInfo}>
//              {/* ✅ NEW: Show Actual Profile Picture from AWS */}
//              <Image 
//                source={{ uri: item.uploader?.profilePicture || 'https://via.placeholder.com/150' }} 
//                style={styles.avatar} 
//              />
//              <Text style={styles.username}>@{item.uploader?.username || "User"}</Text>
//           </View>
//           <Text style={styles.caption}>{item.caption}</Text>
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
//   }

//   if (reels.length === 0) {
//      return (
//        <View style={styles.center}>
//          <Text style={{color: 'white'}}>No Reels yet. Upload one!</Text>
//        </View>
//      );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={reels}
//         renderItem={renderItem}
//         keyExtractor={item => item._id}
//         pagingEnabled
//         vertical
//         showsVerticalScrollIndicator={false}
//         snapToInterval={height} // Full screen snap
//         snapToAlignment="start"
//         decelerationRate="fast"
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'black' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
//   reelContainer: { width: width, height: height, position: 'relative' },
//   video: { width: '100%', height: '100%' },
  
//   overlay: { position: 'absolute', bottom: 100, left: 20, right: 20 },
//   userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  
//   // ✅ NEW STYLE for the Profile Picture
//   avatar: { 
//     width: 32, 
//     height: 32, 
//     borderRadius: 16, 
//     borderWidth: 1.5, 
//     borderColor: '#fff', 
//     marginRight: 10 
//   },
  
//   username: { color: 'white', fontWeight: 'bold', fontSize: 16 },
//   caption: { color: 'white', fontSize: 14 }
// });

// export default ReelsScreen;


import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { getFeed } from '../../api/Posts.api';
import colors from '../../theme/colors';

const { height, width } = Dimensions.get('window');

const ReelsScreen = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchReels();
    }, [])
  );

  const fetchReels = async () => {
    try {
      const data = await getFeed();
      // backend returns { success, data }
      setReels(data.data || []);
    } catch (e) {
      console.error('❌ Error fetching reels:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.reelContainer}>
      <Video
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted={false}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri:
                item.uploader?.profilePicture ||
                'https://via.placeholder.com/150',
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>
            @{item.uploader?.username || 'user'}
          </Text>
        </View>
        <Text style={styles.caption}>{item.caption}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'white' }}>
          No Reels yet. Upload one!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  reelContainer: {
    width,
    height,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  userInfo: {
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
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  caption: {
    color: 'white',
    fontSize: 14,
  },
});

export default ReelsScreen;
