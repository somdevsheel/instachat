import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import PostMedia from './PostMedia.jsx';
import CommentsSection from './CommentsSection.jsx';
import ShareModal from './ShareModal.jsx';
import RepostModal from './RepostModal.jsx';
import PostMenu from './PostMenu.jsx';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, RepostIcon } from './icons.jsx';
import { timeAgo } from '../utils/timeAgo.js';
import { formatCount } from '../utils/formatCount.js';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);

  // Reposts have no media/caption of their own — display the original
  // content, wrapped in an attribution banner.
  const original = post.repostOf || null;
  const isReelRepost = original && post.repostOfModel === 'Reel';
  const displayMedia = original
    ? isReelRepost
      ? { type: 'video', variants: { original: original.videoUrl, thumbnail: original.thumbnailUrl } }
      : original.media
    : post.media;

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await postsApi.likePost(post._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
    }
  };

  const handleSave = async () => {
    setSaved((v) => !v);
    try {
      await postsApi.toggleSavePost(post._id);
    } catch {
      setSaved((v) => !v);
    }
  };

  const handleRepost = async (caption) => {
    // Reposting a repost re-targets onto the original content server-side,
    // so this call is safe regardless of whether `post` is itself a repost.
    await postsApi.repostPost(post._id, caption);
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user?.username}`} className="post-author-link">
          <Avatar src={post.user?.profilePicture} username={post.user?.username} size={44} />
          <div className="post-author-info">
            <div className="post-username">{post.user?.username}</div>
            <div className="post-time">
              {post.createdAt && timeAgo(post.createdAt)}
              {post.location && ` · ${post.location}`}
            </div>
          </div>
        </Link>
        <PostMenu post={post} />
      </div>

      {!original && post.caption && <div className="post-text-only">{post.caption}</div>}
      {!original && post.media && <PostMedia media={post.media} caption={post.caption} />}

      {original && (
        <>
          {post.caption && <div className="post-text-only">{post.caption}</div>}
          <div className="repost-quote">
            <div className="repost-banner">
              <RepostIcon active />
              Reposted from{' '}
              <Link to={`/profile/${original.user?.username}`} className="post-username">
                @{original.user?.username}
              </Link>
            </div>
            {original.caption && <div className="post-text-only">{original.caption}</div>}
            {displayMedia && <PostMedia media={displayMedia} caption={original.caption} />}
          </div>
        </>
      )}

      <div className="post-actions-bar">
        <button className={`post-action ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <HeartIcon filled={liked} />
          {formatCount(likesCount)} {likesCount === 1 ? 'Like' : 'Likes'}
        </button>
        <button className="post-action" onClick={() => setCommentsOpen((v) => !v)}>
          <CommentIcon />
          {formatCount(commentsCount)} {commentsCount === 1 ? 'Comment' : 'Comments'}
        </button>
        <button className="post-action" onClick={() => setSharing(true)}>
          <ShareIcon />
          {formatCount(shareCount)} {shareCount === 1 ? 'Share' : 'Shares'}
        </button>
        <button className="post-action" onClick={() => setReposting(true)}>
          <RepostIcon />
          Repost
        </button>
        <div className="post-action-spacer" />
        <button className={`post-save ${saved ? 'active' : ''}`} onClick={handleSave}>
          <BookmarkIcon active={saved} /> Save
        </button>
      </div>

      {likesCount > 0 && (
        <div className="post-body">
          <div className="post-likes">
            {formatCount(likesCount)} {likesCount === 1 ? 'person' : 'people'} liked this
          </div>
        </div>
      )}

      <CommentsSection
        postId={post._id}
        commentsCount={commentsCount}
        onCountChange={setCommentsCount}
        open={commentsOpen}
        onToggle={() => setCommentsOpen((v) => !v)}
      />

      {sharing && (
        <ShareModal
          postId={post._id}
          onClose={() => setSharing(false)}
          onShared={(count) => setShareCount((c) => (typeof count === 'number' ? count : c + 1))}
        />
      )}

      {reposting && (
        <RepostModal onClose={() => setReposting(false)} onConfirm={handleRepost} label="post" />
      )}
    </article>
  );
}
