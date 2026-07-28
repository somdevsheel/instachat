import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi, reelsApi } from '@instachat/shared';
import PostMedia from '../components/PostMedia.jsx';
import PostDetailModal from '../components/PostDetailModal.jsx';
import { RepostIcon, PlaySolidIcon } from '../components/icons.jsx';
import { getRepostDisplayMedia } from '../utils/repost.js';

const TABS = ['Posts', 'Reels'];

export default function SavedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Posts');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [viewingPostId, setViewingPostId] = useState(null);

  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);

  useEffect(() => {
    postsApi
      .getSavedPosts()
      .then((res) => setPosts(res?.data || []))
      .finally(() => setPostsLoading(false));
  }, []);

  useEffect(() => {
    reelsApi
      .getSavedReels()
      .then((res) => setReels(res?.data || []))
      .finally(() => setReelsLoading(false));
  }, []);

  return (
    <div className="profile-page">
      <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>Saved</h2>

      <div className="profile-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Posts' && (
        <div className="profile-grid">
          {postsLoading && <div className="centered-message">Loading…</div>}
          {!postsLoading && posts.length === 0 && (
            <div className="centered-message">Posts you save will show up here.</div>
          )}
          {!postsLoading &&
            posts.map((post) => (
              <button
                key={post._id}
                type="button"
                className="profile-grid-item"
                onClick={() => setViewingPostId(post._id)}
              >
                {post.repostOf && (
                  <span className="profile-grid-repost-badge">
                    <RepostIcon />
                  </span>
                )}
                <PostMedia media={getRepostDisplayMedia(post)} caption={post.caption} />
              </button>
            ))}
        </div>
      )}

      {activeTab === 'Reels' && (
        <div className="profile-grid">
          {reelsLoading && <div className="centered-message">Loading…</div>}
          {!reelsLoading && reels.length === 0 && (
            <div className="centered-message">Reels you save will show up here.</div>
          )}
          {!reelsLoading &&
            reels.map((reel) => (
              <button
                key={reel._id}
                type="button"
                className="profile-grid-item profile-reel-item"
                onClick={() => navigate('/reels', { state: { openReelId: reel._id } })}
              >
                {reel.thumbnailUrl ? (
                  <img className="post-media" src={reel.thumbnailUrl} alt="" />
                ) : (
                  <video className="post-media" src={reel.videoUrl} muted />
                )}
                <span className="profile-reel-badge">
                  <PlaySolidIcon />
                </span>
              </button>
            ))}
        </div>
      )}

      {viewingPostId && (
        <PostDetailModal postId={viewingPostId} onClose={() => setViewingPostId(null)} />
      )}
    </div>
  );
}
