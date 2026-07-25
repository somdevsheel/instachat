import React, { useEffect, useState } from 'react';
import { postsApi } from '@instachat/shared';
import PostMedia from '../components/PostMedia.jsx';

export default function SavedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi
      .getSavedPosts()
      .then((res) => setPosts(res?.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="profile-page">
      <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>Saved</h2>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && posts.length === 0 && (
        <div className="centered-message">Posts you save will show up here.</div>
      )}

      <div className="profile-grid">
        {posts.map((post) => (
          <div key={post._id} className="profile-grid-item">
            <PostMedia media={post.media} caption={post.caption} />
          </div>
        ))}
      </div>
    </div>
  );
}
