import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed, toggleLike, postsApi } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import PostMedia from '../components/PostMedia.jsx';
import CommentsSection from '../components/CommentsSection.jsx';
import ShareModal from '../components/ShareModal.jsx';
import StoriesBar from '../components/StoriesBar.jsx';
import PostComposer from '../components/PostComposer.jsx';
import ReelsCarousel from '../components/ReelsCarousel.jsx';
import PostMenu from '../components/PostMenu.jsx';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from '../components/icons.jsx';
import { timeAgo } from '../utils/timeAgo.js';
import { formatCount } from '../utils/formatCount.js';

function PostCard({ post }) {
  const dispatch = useDispatch();
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);

  const handleSave = async () => {
    setSaved((v) => !v);
    try {
      await postsApi.toggleSavePost(post._id);
    } catch {
      setSaved((v) => !v);
    }
  };

  const likesCount = post.likesCount || 0;

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

      {post.caption && <div className="post-text-only">{post.caption}</div>}
      {post.media && <PostMedia media={post.media} caption={post.caption} />}

      <div className="post-actions-bar">
        <button
          className={`post-action ${post.isLiked ? 'liked' : ''}`}
          onClick={() => dispatch(toggleLike(post._id))}
        >
          <HeartIcon filled={post.isLiked} />
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
    </article>
  );
}

export default function HomePage() {
  const dispatch = useDispatch();
  const { posts, loading, error } = useSelector((state) => state.feed);

  useEffect(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  return (
    <div className="feed">
      <StoriesBar />
      <PostComposer />
      <ReelsCarousel />

      {loading && <div className="centered-message">Loading feed…</div>}
      {error && <div className="centered-message">{error}</div>}
      {!loading && !error && posts.length === 0 && (
        <div className="centered-message">No posts yet.</div>
      )}

      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
