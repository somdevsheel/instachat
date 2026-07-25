import React, { useEffect, useState } from 'react';
import { reelsApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../utils/timeAgo.js';

export default function ReelCommentsPanel({ reelId, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reelsApi
      .getReelComments(reelId)
      .then((res) => setComments(res?.data || []))
      .finally(() => setLoading(false));
  }, [reelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await reelsApi.addReelComment(reelId, trimmed);
      const next = [...comments, res.data];
      setComments(next);
      onCountChange?.(next.length);
      setText('');
    } catch {
      // keep text so the user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reel-comments-panel">
      <div className="reel-comments-header">
        <span className="post-username">Comments</span>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="reel-comments-list">
        {loading && <div className="centered-message">Loading…</div>}
        {!loading && comments.length === 0 && (
          <div className="centered-message">No comments yet.</div>
        )}
        {comments.map((c) => (
          <div key={c._id} className="comment-row">
            <Avatar src={c.user?.profilePicture} username={c.user?.username} size={28} />
            <div>
              <span className="post-username">{c.user?.username}</span>{' '}
              <span className="comment-text">{c.text}</span>
              <div className="post-time">{timeAgo(c.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      <form className="comment-input-row reel-comments-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!text.trim() || submitting}>
          Post
        </button>
      </form>
    </div>
  );
}
