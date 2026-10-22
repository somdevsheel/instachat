import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import {
  setNotifications,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setLoading,
} from '../redux/slices/notificationSlice';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationApi,
} from '../api/Notification.api';
import { getFollowRequests } from '../api/User.api';
import { ROUTES } from '../navigation/routes.constants';
import usePullToRefresh from '../hooks/usePullToRefresh';

const HEADER_HEIGHT = 50;

const NotificationScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { notifications = [], loading } = useSelector((state) => state.notifications);
  const [localLoading, setLocalLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0); // private-account follow requests

  /* =========================
     FETCH NOTIFICATIONS
  ========================= */
  const fetchNotifications = async () => {
    try {
      dispatch(setLoading(true));
      const [notifRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);

      dispatch(setNotifications(notifRes.data));
      dispatch(setUnreadCount(countRes.data.count));

      getFollowRequests()
        .then((res) => setRequestCount((res.data || []).length))
        .catch(() => {});
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetchNotifications();
  }, []);

  /* =========================
     PULL TO REFRESH
  ========================= */
  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);

  /* =========================
     MARK AS READ
  ========================= */
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      dispatch(markAsRead(notificationId));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  /* =========================
     MARK ALL AS READ
  ========================= */
  const handleMarkAllAsRead = async () => {
    try {
      setLocalLoading(true);
      await markAllNotificationsAsRead();
      dispatch(markAllAsRead());
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  /* =========================
     DELETE NOTIFICATION
  ========================= */
  const handleDelete = async (notificationId) => {
    try {
      await deleteNotificationApi(notificationId);
      dispatch(deleteNotification(notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

/* =========================
   HANDLE NOTIFICATION PRESS
========================= */
const handleNotificationPress = async (notification) => {
  console.log('🔍 Notification clicked:', JSON.stringify(notification, null, 2));
  console.log('🔍 Notification type:', notification.type);
  console.log('🔍 Post ID:', notification.post?._id);
  console.log('🔍 Sender username:', notification.sender?.username);
  
  // Mark as read
  if (!notification.read) {
    handleMarkAsRead(notification._id);
  }

  // Navigate based on type
  switch (notification.type) {
    case 'follow_request':
      navigation.navigate(ROUTES.FOLLOW_REQUESTS);
      break;

    case 'follow':
      console.log('➡️ Navigating to USER_PROFILE');
      navigation.navigate(ROUTES.USER_PROFILE, {
        username: notification.sender?.username,
      });
      break;
      
    case 'like':
    case 'comment':
      console.log('➡️ Like/Comment notification');
      if (notification.post?._id) {
        console.log('➡️ Navigating to POST_DETAIL with postId:', notification.post._id);
        navigation.navigate(ROUTES.POST_DETAIL, {
          postId: notification.post._id,
        });
      } else {
        console.log('⚠️ No post ID found, going back');
        navigation.goBack();
      }
      break;
      
    case 'message':
      console.log('➡️ Navigating to CHAT_DETAIL');
      navigation.navigate(ROUTES.CHAT_DETAIL, {
        chatId: notification.sender?._id,
      });
      break;
      
    default:
      console.log('⚠️ Unknown notification type, going back');
      navigation.goBack();
      break;
  }
};

  /* =========================
     GET NOTIFICATION ICON
  ========================= */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
      case 'follow_request':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'message':
        return '📩';
      case 'mention':
        return '📢';
      default:
        return '🔔';
    }
  };

  /* =========================
     TIME AGO HELPER
  ========================= */
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  /* =========================
     RENDER NOTIFICATION ITEM
  ========================= */
  const renderItem = ({ item }) => {
    const timeAgo = getTimeAgo(item.createdAt);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unread]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          <Image
            source={{
              uri: item.sender?.profilePicture || 'https://via.placeholder.com/50',
            }}
            style={styles.avatar}
          />
          <Text style={styles.typeIcon}>{getNotificationIcon(item.type)}</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.message} numberOfLines={2}>
            <Text style={styles.username}>{item.sender?.username}</Text>{' '}
            {item.message}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {item.post?.media && item.post.media[0]?.url && (
          <Image
            source={{ uri: item.post.media[0].url }}
            style={styles.postThumbnail}
          />
        )}

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  /* =========================
     RENDER EMPTY STATE
  ========================= */
  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubText}>
        When someone likes or comments on your posts, you'll see it here
      </Text>
    </View>
  );

  /* =========================
     RENDER
  ========================= */
  const hasUnread = notifications.some((n) => !n.read);
  const showLoader = loading && notifications.length === 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
      ]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {hasUnread && !localLoading && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        )}

        {localLoading && (
          <ActivityIndicator size="small" color="#0095F6" />
        )}

        {!hasUnread && !localLoading && <View style={{ width: 80 }} />}
      </View>

      {/* FOLLOW REQUESTS (private accounts) */}
      {requestCount > 0 && (
        <TouchableOpacity
          style={styles.requestsRow}
          onPress={() => navigation.navigate(ROUTES.FOLLOW_REQUESTS)}
        >
          <Ionicons name="person-add-outline" size={22} color="#fff" />
          <Text style={styles.requestsText}>Follow requests</Text>
          <Text style={styles.requestsCount}>{requestCount}</Text>
          <Ionicons name="chevron-forward" size={18} color="#888" />
        </TouchableOpacity>
      )}

      {/* NOTIFICATIONS LIST */}
      {showLoader ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default React.memo(NotificationScreen);

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  requestsText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  requestsCount: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllBtn: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  unread: {
    backgroundColor: '#1a1a1a',
  },
  leftSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#262626',
  },
  typeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 18,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  username: {
    fontWeight: 'bold',
  },
  timeAgo: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: 10,
    backgroundColor: '#262626',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095F6',
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#888',
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
});