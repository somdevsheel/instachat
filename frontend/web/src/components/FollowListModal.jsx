import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { userApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { XIcon } from './icons.jsx';

export default function FollowListModal({ userId, type, title, onClose }) {
  const currentUserId = useSelector((state) => state.auth.user?._id);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    userApi
      .getFollowList(userId, type)
      .then((res) => setUsers(res?.data || []))
      .catch(() => setError('Failed to load list'))
      .finally(() => setLoading(false));
  }, [userId, type]);

  const handleFollowToggle = async (targetId) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === targetId ? { ...u, isFollowing: !u.isFollowing } : u))
    );
    try {
      await userApi.toggleFollowUser(targetId);
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u._id === targetId ? { ...u, isFollowing: !u.isFollowing } : u))
      );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card follow-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-list-header">
          <span className="follow-list-title">{title}</span>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="follow-list-body">
          {loading && <div className="centered-message">Loading…</div>}
          {!loading && error && <div className="centered-message">{error}</div>}
          {!loading && !error && users.length === 0 && (
            <div className="centered-message">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          )}

          {!loading &&
            !error &&
            users.map((u) => (
              <div key={u._id} className="right-panel-person">
                <Link
                  to={`/profile/${u.username}`}
                  className="right-panel-person-info"
                  onClick={onClose}
                >
                  <Avatar src={u.profilePicture} username={u.username} size={44} />
                  <div>
                    <div className="post-username">{u.username}</div>
                    <div className="post-time">{u.online ? 'Active now' : 'Offline'}</div>
                  </div>
                </Link>

                {u._id !== currentUserId && (
                  <button
                    className={`follow-list-btn ${u.isFollowing ? 'following' : ''}`}
                    onClick={() => handleFollowToggle(u._id)}
                  >
                    {u.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
