import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { userApi, postsApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { HashIcon } from './icons.jsx';

export default function RightPanel() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    userApi.getSuggestedUsers().then((res) => setSuggestions(res?.data || []));
    postsApi.getTrending().then((res) => setTrending(res?.data || []));
  }, []);

  const handleFollow = async (userId) => {
    setSuggestions((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isFollowing: true } : u))
    );
    try {
      await userApi.followUser(userId);
    } catch {
      setSuggestions((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isFollowing: false } : u))
      );
    }
  };

  const visibleSuggestions = suggestions.filter((u) => !dismissed.has(u._id)).slice(0, 4);

  return (
    <aside className="right-panel">
      <div className="right-panel-profile-card" onClick={() => navigate('/profile')}>
        <div className="right-panel-profile-card-bg" />
        <div className="right-panel-profile-card-body">
          <Avatar src={user?.profilePicture} username={user?.username} size={56} />
          <div className="right-panel-profile-info">
            <div className="right-panel-profile-name">{user?.name || user?.username}</div>
            <div className="right-panel-profile-link">View Profile</div>
          </div>
        </div>
        <div className="right-panel-stats">
          <div>
            <strong>{user?.postsCount ?? 0}</strong>
            <span>Posts</span>
          </div>
          <div>
            <strong>{user?.followersCount ?? 0}</strong>
            <span>Followers</span>
          </div>
          <div>
            <strong>{user?.followingCount ?? 0}</strong>
            <span>Following</span>
          </div>
        </div>
      </div>

      <div className="right-panel-section">
        <div className="right-panel-section-header">
          <span>People You May Know</span>
          <Link to="/search">See all</Link>
        </div>

        {visibleSuggestions.length === 0 && (
          <div className="post-time">No suggestions right now.</div>
        )}

        {visibleSuggestions.map((u) => (
          <div key={u._id} className="right-panel-person">
            <Link to={`/profile/${u.username}`} className="right-panel-person-info">
              <Avatar src={u.profilePicture} username={u.username} size={40} />
              <div>
                <div className="post-username">{u.username}</div>
                <div className="post-time">
                  {u.mutualCount > 0
                    ? `${u.mutualCount} mutual friend${u.mutualCount === 1 ? '' : 's'}`
                    : 'Suggested for you'}
                </div>
              </div>
            </Link>
            <div className="right-panel-person-actions">
              {u.isFollowing ? (
                <span className="post-time">Following</span>
              ) : (
                <button className="add-friend-btn" onClick={() => handleFollow(u._id)}>
                  Add Friend
                </button>
              )}
              <button
                className="right-panel-dismiss"
                onClick={() => setDismissed((prev) => new Set(prev).add(u._id))}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="right-panel-section">
        <div className="right-panel-section-header">
          <span>Trending Now</span>
        </div>

        {trending.length === 0 && (
          <div className="post-time">No trending tags yet.</div>
        )}

        {trending.map((t) => (
          <div key={t.tag} className="right-panel-trend">
            <span className="right-panel-trend-tag">
              <span className="right-panel-trend-icon">
                <HashIcon />
              </span>
              {t.tag}
            </span>
            <span className="post-time">{t.postsCount} posts</span>
          </div>
        ))}
      </div>

      <div className="right-panel-footer">
        <a href="#">About</a> · <a href="#">Help</a> · <a href="#">Privacy</a> ·{' '}
        <a href="#">Terms</a>
        <div style={{ marginTop: 6 }}>© {new Date().getFullYear()} Nebula</div>
      </div>
    </aside>
  );
}
