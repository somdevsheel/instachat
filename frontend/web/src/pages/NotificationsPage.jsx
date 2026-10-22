import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  notificationApi,
  userApi,
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
  follow_request: 'requested to follow you',
  message: 'sent you a message',
  mention: 'mentioned you',
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications } = useSelector((state) => state.notifications);
  const [loading, setLoading] = useState(true);
  // Pending follow requests to my (private) account.
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    notificationApi
      .getNotifications()
      .then((res) => dispatch(setNotifications(res?.data || [])))
      .finally(() => setLoading(false));
    userApi
      .getFollowRequests()
      .then((res) => setRequests(res?.data || []))
      .catch(() => {});
  }, [dispatch]);

  const respond = async (userId, action) => {
    setBusyId(userId);
    try {
      await userApi.respondToFollowRequest(userId, action);
      setRequests((prev) => prev.filter((r) => r._id !== userId));
    } catch {
      // leave the row so the user can retry
    } finally {
      setBusyId(null);
    }
  };

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

    if (n.type === 'follow' || n.type === 'follow_request') {
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

      {requests.length > 0 && (
        <section className="follow-requests">
          <h3 className="right-panel-section-header">Follow requests</h3>
          <ul className="notification-list">
            {requests.map((r) => (
              <li key={r._id} className="notification-item">
                <Avatar src={r.profilePicture} username={r.username} size={44} />
                <div className="notification-body">
                  <button
                    type="button"
                    className="post-username comments-toggle"
                    onClick={() => navigate(`/profile/${r.username}`)}
                  >
                    {r.username}
                  </button>
                  {r.name && <div className="post-time">{r.name}</div>}
                </div>
                <button
                  className="follow-button"
                  disabled={busyId === r._id}
                  onClick={() => respond(r._id, 'accept')}
                >
                  Confirm
                </button>
                <button
                  className="follow-button secondary"
                  disabled={busyId === r._id}
                  onClick={() => respond(r._id, 'decline')}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
