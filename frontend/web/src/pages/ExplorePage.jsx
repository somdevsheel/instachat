import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '@instachat/shared';
import PostMedia from '../components/PostMedia.jsx';

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi
      .getFeed()
      .then((res) => setPosts((res?.data || []).filter((p) => p.media)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="profile-page">
      <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>Explore</h2>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && posts.length === 0 && (
        <div className="centered-message">Nothing to explore yet.</div>
      )}

      <div className="profile-grid">
        {posts.map((post) => (
          <Link
            key={post._id}
            to={`/profile/${post.user?.username}`}
            className="profile-grid-item"
          >
            <PostMedia media={post.media} caption={post.caption} />
          </Link>
        ))}
      </div>
    </div>
  );
}
