import React, { useEffect, useState } from 'react';
import { postsApi } from '@instachat/shared';
import PostCard from './PostCard.jsx';
import { XIcon } from './icons.jsx';

export default function PostDetailModal({ postId, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    postsApi
      .getPostById(postId)
      .then((res) => setPost(res?.data || null))
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card post-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button post-detail-close" onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </button>

        {loading && <div className="centered-message">Loading…</div>}
        {!loading && error && <div className="centered-message">{error}</div>}
        {!loading && !error && post && <PostCard post={post} />}
      </div>
    </div>
  );
}
