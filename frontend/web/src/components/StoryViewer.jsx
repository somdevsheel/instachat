import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { storyApi, markStoriesViewed } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../utils/timeAgo.js';

export default function StoryViewer({ group, onClose }) {
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const story = group.stories[index];

  useEffect(() => {
    if (!story) return;
    storyApi.markStoriesSeen([story._id]).catch(() => {});
    dispatch(markStoriesViewed([story._id]));
  }, [story?._id]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const goNext = () => {
    if (index < group.stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  if (!story) return null;

  return (
    <div className="story-viewer-backdrop" onClick={onClose}>
      <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="story-progress-row">
          {group.stories.map((s, i) => (
            <div key={s._id} className="story-progress-track">
              <div
                className="story-progress-fill"
                style={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="story-header">
          <Avatar src={group.user.profilePicture} username={group.user.username} size={32} />
          <span className="post-username" style={{ color: '#fff' }}>
            {group.user.username}
          </span>
          <span className="post-time" style={{ color: '#e0e0e0' }}>
            {timeAgo(story.createdAt)}
          </span>
          <button className="story-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {story.media?.type === 'video' ? (
          <video
            className="story-media"
            src={story.media.url}
            autoPlay
            onEnded={goNext}
            controls={false}
          />
        ) : (
          <img className="story-media" src={story.media?.url} alt="" />
        )}

        <button className="story-nav story-nav-prev" onClick={goPrev} aria-label="Previous" />
        <button className="story-nav story-nav-next" onClick={goNext} aria-label="Next" />
      </div>
    </div>
  );
}
