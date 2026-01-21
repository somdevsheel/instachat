// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   StyleSheet,
// } from 'react-native';
// import { useSelector } from 'react-redux';
// import api from '../../services/api';
// import { ROUTES } from '../../navigation/routes.constants';

// const FollowListScreen = ({ route, navigation }) => {
//   const { userId, type } = route.params; // type = followers | following
//   const { user: authUser } = useSelector(state => state.auth);

//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchList = async () => {
//       try {
//         const res = await api.get(
//           `/users/${type}/${userId}`
//         );
//         setUsers(res.data.data);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchList();
//   }, [userId, type]);

//   const followingIds = Array.isArray(authUser?.following)
//     ? authUser.following.map(id => id.toString())
//     : [];

//   const renderItem = ({ item }) => {
//     const isFollowing = followingIds.includes(item._id);

//     return (
//       <TouchableOpacity
//         style={styles.row}
//         onPress={() =>
//           navigation.navigate(ROUTES.USER_PROFILE, {
//             username: item.username,
//           })
//         }
//       >
//         <Image
//           source={{
//             uri: item.profilePicture || 'https://via.placeholder.com/50',
//           }}
//           style={styles.avatar}
//         />

//         <Text style={styles.username}>{item.username}</Text>

//         {authUser._id !== item._id && (
//           <TouchableOpacity
//             style={[
//               styles.followBtn,
//               isFollowing && styles.followingBtn,
//             ]}
//           >
//             <Text style={styles.followText}>
//               {isFollowing ? 'Following' : 'Follow'}
//             </Text>
//           </TouchableOpacity>
//         )}
//       </TouchableOpacity>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#0095F6" />
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={users}
//       keyExtractor={item => item._id}
//       renderItem={renderItem}
//       style={{ backgroundColor: 'black' }}
//     />
//   );
// };

// export default FollowListScreen;

// const styles = StyleSheet.create({
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//   },
//   avatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     marginRight: 12,
//   },
//   username: { color: 'white', flex: 1 },
//   followBtn: {
//     backgroundColor: '#0095F6',
//     paddingHorizontal: 14,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   followingBtn: { backgroundColor: '#262626' },
//   followText: { color: 'white', fontWeight: '600' },
// });



import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROUTES } from '../../navigation/routes.constants';

const FollowListScreen = ({ route, navigation }) => {
  const { userId, type } = route.params; // type = followers | following
  const { user: authUser } = useSelector(state => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      try {
        // ✅ FIXED: Correct order is /:id/:type
        const res = await api.get(`/users/${userId}/${type}`);
        setUsers(res.data.data);
      } catch (e) {
        console.error('Fetch list error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [userId, type]);

  // ✅ Handle follow/unfollow
  const handleFollowToggle = async (targetUserId) => {
    // Optimistically update UI
    setUsers(prev =>
      prev.map(u =>
        u._id === targetUserId
          ? { ...u, isFollowing: !u.isFollowing }
          : u
      )
    );

    try {
      await api.post(`/users/follow/${targetUserId}`);
    } catch (err) {
      console.error('Follow toggle error:', err);
      // Rollback on error
      setUsers(prev =>
        prev.map(u =>
          u._id === targetUserId
            ? { ...u, isFollowing: !u.isFollowing }
            : u
        )
      );
    }
  };

  const renderItem = ({ item }) => {
    return (
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
              uri: item.profilePicture || 'https://via.placeholder.com/50',
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>

        {authUser._id !== item._id && (
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
    );
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
        renderItem={renderItem}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              No {type} yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default FollowListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  username: {
    color: 'white',
    fontSize: 16,
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
  },
  followText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});