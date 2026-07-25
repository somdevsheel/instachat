import React, { useEffect, useState } from 'react';
import { commentsApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../utils/timeAgo.js';

export default function CommentsSection({ postId, commentsCount, onCountChange, open, onToggle }) {
  const [comments, setComments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && comments === null) {
      setLoading(true);
      commentsApi
        .getComments(postId)
        .then((res) => setComments(res?.data || []))
        .catch(() => setComments([]))
        .finally(() => setLoading(false));
    }
  }, [open, postId, comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await commentsApi.addComment(postId, trimmed);
      const updated = res?.data || [];
      setComments(updated);
      setText('');
      onCountChange?.(updated.length);
    } catch {
      // leave the input text so the user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-section">
      <button className="comments-toggle" onClick={onToggle}>
        {commentsCount > 0
          ? `View ${open ? '' : 'all '}${commentsCount} comment${commentsCount === 1 ? '' : 's'}`
          : 'Add a comment'}
      </button>

      {open && (
        <div className="comments-body">
          {loading && <div className="centered-message">Loading…</div>}
          {!loading &&
            comments?.map((c) => (
              <div key={c._id} className="comment-row">
                <Avatar src={c.user?.profilePicture} username={c.user?.username} size={28} />
                <div>
                  <span className="post-username">{c.user?.username}</span>{' '}
                  <span className="comment-text">{c.text}</span>
                  <div className="post-time">{timeAgo(c.createdAt)}</div>
                </div>
              </div>
            ))}
          {!loading && comments?.length === 0 && (
            <div className="centered-message">No comments yet.</div>
          )}

          <form className="comment-input-row" onSubmit={handleSubmit}>
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
      )}
    </div>
  );
}
