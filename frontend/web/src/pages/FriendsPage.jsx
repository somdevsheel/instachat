import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi
      .getMutualFollowers()
      .then((res) => setFriends(res?.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="search-page">
      <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>Friends</h2>
      <p className="post-time" style={{ marginBottom: 16 }}>
        People you follow who follow you back.
      </p>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && friends.length === 0 && (
        <div className="centered-message">
          No mutual friends yet — follow people back and forth to see them here.
        </div>
      )}

      <ul className="search-results">
        {friends.map((f) => (
          <li key={f._id} className="search-result">
            <button className="search-result-user" onClick={() => navigate(`/profile/${f.username}`)}>
              <Avatar src={f.profilePicture} username={f.username} size={44} />
              <div>
                <div className="post-username">{f.username}</div>
                <div className="post-time">{f.online ? 'Active now' : 'Offline'}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
