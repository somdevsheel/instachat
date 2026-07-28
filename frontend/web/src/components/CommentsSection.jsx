import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { commentsApi, userApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../utils/timeAgo.js';

const MENTION_REGEX = /@[a-zA-Z0-9_.]+/g;

function renderTextWithMentions(text) {
  if (!text) return null;
  const parts = text.split(MENTION_REGEX);
  const mentions = text.match(MENTION_REGEX) || [];

  const nodes = [];
  parts.forEach((part, i) => {
    if (part) nodes.push(part);
    if (mentions[i]) {
      const username = mentions[i].slice(1);
      nodes.push(
        <Link key={`m-${i}`} to={`/profile/${username}`} className="comment-mention">
          {mentions[i]}
        </Link>
      );
    }
  });
  return nodes;
}

function CommentLikeButton({ comment }) {
  const [liked, setLiked] = useState(!!comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      const res = await commentsApi.toggleCommentLike(comment._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    }
  };

  return (
    <button
      type="button"
      className={`comment-like-btn ${liked ? 'liked' : ''}`}
      onClick={handleLike}
    >
      {liked ? '♥' : '♡'} {likesCount > 0 && likesCount}
    </button>
  );
}

function CommentRow({ comment, onReply, isReply }) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const prevRepliesCountRef = useRef(comment.repliesCount);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const res = await commentsApi.getCommentReplies(comment._id);
      setReplies(res?.data || []);
    } catch {
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = async () => {
    if (repliesOpen) {
      setRepliesOpen(false);
      return;
    }
    setRepliesOpen(true);
    if (replies === null) {
      await fetchReplies();
    }
  };

  // A reply-to-a-reply re-parents onto this thread's root, so its
  // repliesCount bumps here — refetch the open list to pick it up.
  useEffect(() => {
    if (isReply) return;
    if (
      repliesOpen &&
      replies !== null &&
      comment.repliesCount !== prevRepliesCountRef.current
    ) {
      fetchReplies();
    }
    prevRepliesCountRef.current = comment.repliesCount;
  }, [comment.repliesCount]);

  return (
    <div className={`comment-row ${isReply ? 'is-reply' : ''}`}>
      <Avatar src={comment.user?.profilePicture} username={comment.user?.username} size={isReply ? 24 : 28} />
      <div className="comment-body">
        <div>
          <Link to={`/profile/${comment.user?.username}`} className="post-username">
            {comment.user?.username}
          </Link>{' '}
          <span className="comment-text">{renderTextWithMentions(comment.content)}</span>
        </div>
        <div className="comment-meta">
          <span className="post-time">{timeAgo(comment.createdAt)}</span>
          <CommentLikeButton comment={comment} />
          <button type="button" className="comment-reply-btn" onClick={() => onReply(comment)}>
            Reply
          </button>
        </div>

        {!isReply && comment.repliesCount > 0 && (
          <button type="button" className="comment-view-replies-btn" onClick={toggleReplies}>
            —— {repliesOpen ? 'Hide' : 'View'} {comment.repliesCount}{' '}
            {comment.repliesCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {repliesOpen && (
          <div className="comment-replies">
            {loadingReplies && <div className="post-time">Loading…</div>}
            {!loadingReplies &&
              replies?.map((r) => (
                <CommentRow key={r._id} comment={r} isReply onReply={onReply} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsSection({ postId, commentsCount, onCountChange, open, onToggle }) {
  const [comments, setComments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStart, setMentionStart] = useState(null);
  const [mentionResults, setMentionResults] = useState([]);
  const friendsCacheRef = useRef(null);
  const mentionDebounceRef = useRef(null);
  const inputRef = useRef(null);

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

  const loadFriendSuggestions = async () => {
    if (friendsCacheRef.current) return friendsCacheRef.current;
    try {
      const res = await userApi.getMutualFollowers();
      friendsCacheRef.current = res?.data || [];
    } catch {
      friendsCacheRef.current = [];
    }
    return friendsCacheRef.current;
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setText(value);

    // Look backward from the cursor for an unbroken @word — that's the
    // active mention query. No match means we're not in mention mode.
    const upToCursor = value.slice(0, cursor);
    const match = upToCursor.match(/(?:^|\s)@([a-zA-Z0-9_.]*)$/);

    if (!match) {
      setMentionQuery(null);
      setMentionResults([]);
      return;
    }

    const query = match[1];
    const startIndex = cursor - query.length - 1; // position of the '@'
    setMentionQuery(query);
    setMentionStart(startIndex);

    clearTimeout(mentionDebounceRef.current);

    if (!query) {
      loadFriendSuggestions().then((friends) => setMentionResults(friends.slice(0, 6)));
      return;
    }

    mentionDebounceRef.current = setTimeout(async () => {
      const friends = await loadFriendSuggestions();
      const friendMatches = friends.filter((f) =>
        f.username.toLowerCase().startsWith(query.toLowerCase())
      );
      try {
        const res = await userApi.searchUsers(query);
        const searchMatches = res?.data || [];
        const merged = [...friendMatches, ...searchMatches].filter(
          (u, i, arr) => arr.findIndex((x) => x._id === u._id) === i
        );
        setMentionResults(merged.slice(0, 6));
      } catch {
        setMentionResults(friendMatches.slice(0, 6));
      }
    }, 250);
  };

  const insertMention = (username) => {
    const before = text.slice(0, mentionStart);
    const after = text.slice(mentionStart + 1 + mentionQuery.length);
    const next = `${before}@${username} ${after}`;
    setText(next);
    setMentionQuery(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setText(`@${comment.user?.username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await commentsApi.addComment(postId, trimmed, replyingTo?._id);
      const newComment = res?.data;

      if (replyingTo && newComment) {
        // The server re-parents "reply to a reply" onto the thread root,
        // so newComment.replyTo is always the top-level comment's id.
        const rootId = newComment.replyTo;
        setComments((prev) =>
          prev.map((c) =>
            c._id === rootId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
          )
        );
      } else if (newComment) {
        setComments((prev) => [newComment, ...(prev || [])]);
        onCountChange?.((commentsCount || 0) + 1);
      }

      setText('');
      setReplyingTo(null);
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
          {!loading && comments?.map((c) => (
            <CommentRow key={c._id} comment={c} onReply={handleReply} />
          ))}
          {!loading && comments?.length === 0 && (
            <div className="centered-message">No comments yet.</div>
          )}

          {replyingTo && (
            <div className="comment-replying-banner">
              Replying to @{replyingTo.user?.username}
              <button type="button" onClick={cancelReply}>
                Cancel
              </button>
            </div>
          )}

          <form className="comment-input-row" onSubmit={handleSubmit}>
            <div className="comment-input-wrap">
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a comment…"
                value={text}
                onChange={handleTextChange}
                autoFocus
              />
              {mentionQuery !== null && mentionResults.length > 0 && (
                <div className="mention-dropdown">
                  {mentionResults.map((u) => (
                    <button
                      type="button"
                      key={u._id}
                      className="mention-option"
                      onClick={() => insertMention(u.username)}
                    >
                      <Avatar src={u.profilePicture} username={u.username} size={24} />
                      <span>{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={!text.trim() || submitting}>
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
