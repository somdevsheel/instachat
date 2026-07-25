import React, { useEffect, useState } from 'react';
import { postsApi } from '@instachat/shared';
import PostMedia from '../components/PostMedia.jsx';
import PostDetailModal from '../components/PostDetailModal.jsx';

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPostId, setViewingPostId] = useState(null);

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
          <button
            key={post._id}
            type="button"
            className="profile-grid-item"
            onClick={() => setViewingPostId(post._id)}
          >
            <PostMedia media={post.media} caption={post.caption} />
          </button>
        ))}
      </div>

      {viewingPostId && (
        <PostDetailModal postId={viewingPostId} onClose={() => setViewingPostId(null)} />
      )}
    </div>
  );
}
