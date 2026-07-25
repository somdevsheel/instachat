import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleReelLike, trackReelView } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import ShareModal from './ShareModal.jsx';
import ReelCommentsPanel from './ReelCommentsPanel.jsx';
import { HeartIcon, CommentIcon, ShareIcon } from './icons.jsx';

export default function ReelSlide({ reel, registerRef }) {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const slideRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [commentsCount, setCommentsCount] = useState(reel.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    registerRef?.(reel._id, slideRef.current);
  }, [reel._id, registerRef]);

  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting && entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      if (!hasTrackedView) {
        dispatch(trackReelView(reel._id));
        setHasTrackedView(true);
      }
    } else {
      video.pause();
    }
  }, [isActive, dispatch, reel._id, hasTrackedView]);

  return (
    <div ref={slideRef} className="reel-slide">
      <video
        ref={videoRef}
        className="reel-slide-video"
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        playsInline
        onClick={(e) => (e.target.paused ? e.target.play() : e.target.pause())}
      />

      <div className="reel-slide-bottom">
        <Link to={`/profile/${reel.user?.username}`} className="reel-user">
          <Avatar src={reel.user?.profilePicture} username={reel.user?.username} size={36} />
          <span className="post-username" style={{ color: '#fff' }}>
            {reel.user?.username}
          </span>
        </Link>
        {reel.caption && <div className="reel-caption">{reel.caption}</div>}
      </div>

      <div className="reel-action-rail">
        <button
          className={`reel-rail-button ${reel.isLiked ? 'liked' : ''}`}
          onClick={() => dispatch(toggleReelLike(reel._id))}
        >
          <HeartIcon filled={reel.isLiked} />
          <span>{reel.likesCount || 0}</span>
        </button>
        <button className="reel-rail-button" onClick={() => setShowComments(true)}>
          <CommentIcon />
          <span>{commentsCount}</span>
        </button>
        <button className="reel-rail-button" onClick={() => setShowShare(true)}>
          <ShareIcon />
          <span>{reel.shareCount || ''}</span>
        </button>
      </div>

      {showComments && (
        <ReelCommentsPanel
          reelId={reel._id}
          onClose={() => setShowComments(false)}
          onCountChange={setCommentsCount}
        />
      )}

      {showShare && <ShareModal reelId={reel._id} onClose={() => setShowShare(false)} />}
    </div>
  );
}
