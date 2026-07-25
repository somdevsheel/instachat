import React, { useState } from 'react';

export default function Avatar({ src, username, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const initial = (username || '?').charAt(0).toUpperCase();

  if (!src || failed) {
    return (
      <div
        className="avatar avatar-fallback"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      className="avatar"
      src={src}
      alt={username || 'user'}
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}
