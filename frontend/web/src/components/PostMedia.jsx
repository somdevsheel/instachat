import React, { useState } from 'react';

export default function PostMedia({ media, caption }) {
  const [failed, setFailed] = useState(false);
  const src = media?.variants?.thumbnail || media?.variants?.original;

  if (!src || failed) {
    return (
      <div className="post-media post-media-fallback">
        <span>Image unavailable</span>
      </div>
    );
  }

  if (media?.type === 'video') {
    return (
      <video
        className="post-media"
        src={media.variants.original}
        controls
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      className="post-media"
      src={src}
      alt={caption || 'post'}
      onError={() => setFailed(true)}
    />
  );
}
