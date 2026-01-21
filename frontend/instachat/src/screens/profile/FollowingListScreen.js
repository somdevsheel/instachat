// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useSelector } from 'react-redux';
// import api from '../../services/api';
// import { ROUTES } from '../../navigation/routes.constants';

// const FollowingListScreen = ({ route, navigation }) => {
//   const { userId } = route.params || {};
//   const { user: authUser } = useSelector(state => state.auth);

//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!userId) return;

//     const fetchFollowing = async () => {
//       try {
//         const res = await api.get(`/users/${userId}/following`);

//         const formatted = (res.data.data || []).map(u => ({
//           ...u,
//           isFollowing: true, // following list = always true initially
//         }));

//         setUsers(formatted);
//       } catch (err) {
//         console.error('Following fetch error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFollowing();
//   }, [userId]);

//   const handleUnfollow = async (targetUserId) => {
//     setUsers(prev => prev.filter(u => u._id !== targetUserId));

//     try {
//       await api.post(`/users/follow/${targetUserId}`);
//     } catch (err) {
//       console.error('Unfollow error:', err);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#0095F6" />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <FlatList
//         data={users}
//         keyExtractor={item => item._id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <TouchableOpacity
//               style={styles.left}
//               onPress={() =>
//                 navigation.navigate(ROUTES.USER_PROFILE, {
//                   username: item.username,
//                 })
//               }
//             >
//               <Image
//                 source={{
//                   uri:
//                     item.profilePicture ||
//                     'https://via.placeholder.com/50',
//                 }}
//                 style={styles.avatar}
//               />
//               <Text style={styles.username}>{item.username}</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.followBtn, styles.followingBtn]}
//               onPress={() => handleUnfollow(item._id)}
//             >
//               <Text style={styles.followText}>Following</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />
//     </SafeAreaView>
//   );
// };

// export default FollowingListScreen;


// /* =====================
//    STYLES (UI UNCHANGED)
// ===================== */
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'black' },
//   center: {
//     flex: 1,
//     backgroundColor: 'black',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     justifyContent: 'space-between',
//   },
//   left: { flexDirection: 'row', alignItems: 'center' },
//   avatar: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     marginRight: 12,
//   },
//   username: { color: 'white', fontSize: 16 },
//   followBtn: {
//     backgroundColor: '#0095F6',
//     paddingHorizontal: 14,
//     height: 30,
//     borderRadius: 6,
//     justifyContent: 'center',
//   },
//   followingBtn: {
//     backgroundColor: '#262626',
//   },
//   followText: {
//     color: 'white',
//     fontSize: 13,
//     fontWeight: '600',
//   },
// });









import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const FollowingListScreen = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const { user: authUser } = useSelector(state => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Check if viewing own profile
  const isOwnProfile = userId === authUser?._id;

  useEffect(() => {
    if (!userId) return;

    const fetchFollowing = async () => {
      try {
        const res = await api.get(`/users/${userId}/following`);
        const list = res.data.data || [];

        if (isOwnProfile) {
          // ✅ Own profile: All users are followed by definition
          const formatted = list.map(u => ({
            ...u,
            isFollowing: true,
          }));
          setUsers(formatted);
        } else {
          // ✅ Other's profile: Check against our following list
          const myFollowingIds = authUser?.following?.map(f => f._id || f) || [];
          
          const formatted = list.map(u => ({
            ...u,
            isFollowing: myFollowingIds.includes(u._id),
          }));
          setUsers(formatted);
        }
      } catch (err) {
        console.error('Following fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userId, authUser, isOwnProfile]);

  const handleFollowToggle = async (targetUserId) => {
    const user = users.find(u => u._id === targetUserId);
    const wasFollowing = user?.isFollowing;

    // ✅ If viewing own following list and unfollowing, remove from list
    if (isOwnProfile && wasFollowing) {
      setUsers(prev => prev.filter(u => u._id !== targetUserId));
    } else {
      // ✅ Otherwise, just toggle the status
      setUsers(prev =>
        prev.map(u =>
          u._id === targetUserId
            ? { ...u, isFollowing: !u.isFollowing }
            : u
        )
      );
    }

    try {
      await api.post(`/users/follow/${targetUserId}`);
    } catch (err) {
      console.error('Follow toggle error:', err);
      
      // Rollback on error
      if (isOwnProfile && wasFollowing) {
        // Re-add the removed user
        const restoredUser = { ...user, isFollowing: true };
        setUsers(prev => [...prev, restoredUser]);
      } else {
        // Revert the toggle
        setUsers(prev =>
          prev.map(u =>
            u._id === targetUserId
              ? { ...u, isFollowing: !u.isFollowing }
              : u
          )
        );
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        data={users}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.left}
              onPress={() =>
                navigation.navigate(ROUTES.USER_PROFILE, {
                  username: item.username,
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.profilePicture ||
                    'https://via.placeholder.com/50',
                }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>

            {/* ✅ Don't show button for own profile */}
            {item._id !== authUser?._id && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  item.isFollowing && styles.followingBtn,
                ]}
                onPress={() => handleFollowToggle(item._id)}
              >
                <Text style={styles.followText}>
                  {item.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No following yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default FollowingListScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  left: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  username: { 
    color: 'white', 
    fontSize: 16 
  },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
  },
  followingBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#363636',
  },
  followText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});