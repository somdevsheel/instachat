import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  notificationApi,
  setNotifications,
  markAsRead,
  markAllAsRead,
  setUnreadCount,
} from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import { timeAgo } from '../utils/timeAgo.js';

const MESSAGE_BY_TYPE = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  message: 'sent you a message',
  mention: 'mentioned you',
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications } = useSelector((state) => state.notifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationApi
      .getNotifications()
      .then((res) => dispatch(setNotifications(res?.data || [])))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleClick = async (n) => {
    if (!n.read) {
      dispatch(markAsRead(n._id));
      try {
        await notificationApi.markNotificationAsRead(n._id);
        const res = await notificationApi.getUnreadCount();
        dispatch(setUnreadCount(res?.data?.count ?? 0));
      } catch {
        // redux state already reflects "read" optimistically; the count
        // will self-correct next time it's fetched (e.g. AppLayout mount)
      }
    }

    if (n.type === 'follow') {
      navigate(`/profile/${n.sender?.username}`);
    } else if (n.post?._id) {
      navigate('/');
    }
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllAsRead());
    await notificationApi.markAllNotificationsAsRead().catch(() => {});
    dispatch(setUnreadCount(0));
  };

  return (
    <div className="notifications-page">
      <div className="page-header-row">
        <h2 className="page-title" style={{ padding: 0 }}>Notifications</h2>
        {notifications.length > 0 && (
          <button className="comments-toggle" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && notifications.length === 0 && (
        <div className="centered-message">No notifications yet.</div>
      )}

      <ul className="notification-list">
        {notifications.map((n) => (
          <li key={n._id}>
            <button
              className={`notification-item ${n.read ? '' : 'unread'}`}
              onClick={() => handleClick(n)}
            >
              <Avatar src={n.sender?.profilePicture} username={n.sender?.username} size={44} />
              <div className="notification-body">
                <span className="post-username">{n.sender?.username}</span>{' '}
                {n.message || MESSAGE_BY_TYPE[n.type] || 'sent a notification'}
                <div className="post-time">{timeAgo(n.createdAt)}</div>
              </div>
              {n.post?.media && (
                <img
                  className="notification-thumb"
                  src={n.post.media?.variants?.thumbnail || n.post.media?.variants?.original}
                  alt=""
                />
              )}
              {!n.read && <span className="notification-dot" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
