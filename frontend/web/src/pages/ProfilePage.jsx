import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userApi, reelsApi, getOrCreateChat } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import PostMedia from '../components/PostMedia.jsx';
import EditProfileModal from '../components/EditProfileModal.jsx';
import FollowListModal from '../components/FollowListModal.jsx';
import PostDetailModal from '../components/PostDetailModal.jsx';
import {
  SettingsIcon,
  LinkIcon,
  VerifiedBadgeIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  PlaySolidIcon,
} from '../components/icons.jsx';
import { formatCount } from '../utils/formatCount.js';

const TABS = ['Posts', 'Reels', 'Tagged', 'About'];

function formatJoinDate(dateString) {
  if (!dateString) return '';
  return `Joined ${new Date(dateString).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })}`;
}

function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  const isOwnProfile = !username || username === currentUser?.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [followListType, setFollowListType] = useState(null);
  const [viewingPostId, setViewingPostId] = useState(null);
  const [activeTab, setActiveTab] = useState('Posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [ownFriends, setOwnFriends] = useState([]);

  useEffect(() => {
    setActiveTab('Posts');
  }, [username]);

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(currentUser);
      return;
    }

    setLoading(true);
    setError('');
    userApi
      .getUserProfile(username)
      .then((res) => setProfile(res?.data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [username, isOwnProfile, currentUser]);

  useEffect(() => {
    setIsFollowing(!!profile?.isFollowing);
  }, [profile?.isFollowing]);

  // "Friends" preview — for your own profile that's people who follow you
  // back; for someone else's profile it's people you both know (mutuals).
  useEffect(() => {
    if (!isOwnProfile) return;
    userApi
      .getMutualFollowers()
      .then((res) => setOwnFriends(res?.data || []))
      .catch(() => {});
  }, [isOwnProfile]);

  useEffect(() => {
    if (!profile?._id) return;
    setReels([]);
    if (activeTab !== 'Reels') return;

    setReelsLoading(true);
    reelsApi
      .getUserReels(profile._id)
      .then((res) => setReels(res?.data || []))
      .catch(() => {})
      .finally(() => setReelsLoading(false));
  }, [activeTab, profile?._id]);

  const handleMessage = async () => {
    if (!profile?._id) return;
    const result = await dispatch(getOrCreateChat(profile._id));
    if (getOrCreateChat.fulfilled.match(result)) {
      navigate(`/messages/${result.payload._id}`, {
        state: { receiverId: profile._id, username: profile.username },
      });
    }
  };

  const handleFollowToggle = async () => {
    if (!profile?._id) return;
    setIsFollowing((v) => !v);
    try {
      await userApi.toggleFollowUser(profile._id);
    } catch {
      setIsFollowing((v) => !v);
    }
  };

  if (loading) return <div className="centered-message">Loading profile…</div>;
  if (error) return <div className="centered-message">{error}</div>;
  if (!profile) return null;

  const friendsPreview = isOwnProfile ? ownFriends : profile.mutualPreview || [];
  const photos = (profile.posts || []).slice(0, 6);
  const hasAboutInfo = profile.location || profile.website || profile.createdAt;

  return (
    <div className="profile-layout">
      <div className="profile-main">
        <div className="profile-banner">
          {isOwnProfile && (
            <button
              className="profile-banner-settings"
              onClick={() => navigate('/settings')}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          )}
        </div>

        <div className="profile-header">
          <div className="profile-avatar-wrap">
            <Avatar src={profile.profilePicture} username={profile.username} size={110} />
          </div>

          <div className="profile-header-info">
            <div className="profile-name-row">
              <div className="profile-name-block">
                <h1 className="profile-display-name">
                  {profile.name || profile.username}
                  {profile.isVerified && <VerifiedBadgeIcon />}
                </h1>
                <span className="profile-handle">@{profile.username}</span>
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <button className="follow-button" onClick={() => setEditing(true)}>
                    Edit profile
                  </button>
                ) : (
                  <>
                    <button
                      className={`follow-button ${isFollowing ? 'following' : ''}`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button className="follow-button secondary" onClick={handleMessage}>
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {profile.bio && <div className="profile-bio">{profile.bio}</div>}

            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{profile.postsCount ?? profile.posts?.length ?? 0}</strong>
                <span>Posts</span>
              </div>
              <button
                type="button"
                className="profile-stat profile-stat-btn"
                onClick={() => setFollowListType('followers')}
              >
                <strong>{formatCount(profile.followersCount ?? 0)}</strong>
                <span>Followers</span>
              </button>
              <button
                type="button"
                className="profile-stat profile-stat-btn"
                onClick={() => setFollowListType('following')}
              >
                <strong>{formatCount(profile.followingCount ?? 0)}</strong>
                <span>Following</span>
              </button>
            </div>
          </div>
        </div>

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
            {(profile.posts || []).map((post) => (
              <button
                key={post._id}
                type="button"
                className="profile-grid-item"
                onClick={() => setViewingPostId(post._id)}
              >
                <PostMedia media={post.media} />
              </button>
            ))}
            {(profile.posts || []).length === 0 && (
              <div className="centered-message">No posts yet.</div>
            )}
          </div>
        )}

        {activeTab === 'Reels' && (
          <div className="profile-grid">
            {reelsLoading && <div className="centered-message">Loading reels…</div>}
            {!reelsLoading &&
              reels.map((reel) => (
                <div key={reel._id} className="profile-grid-item profile-reel-item">
                  {reel.thumbnailUrl ? (
                    <img className="post-media" src={reel.thumbnailUrl} alt="" />
                  ) : (
                    <video className="post-media" src={reel.videoUrl} muted />
                  )}
                  <span className="profile-reel-badge">
                    <PlaySolidIcon />
                  </span>
                </div>
              ))}
            {!reelsLoading && reels.length === 0 && (
              <div className="centered-message">No reels yet.</div>
            )}
          </div>
        )}

        {activeTab === 'Tagged' && (
          <div className="centered-message">No tagged posts yet.</div>
        )}

        {activeTab === 'About' && (
          <div className="profile-about-tab">
            {hasAboutInfo ? (
              <>
                {profile.location && (
                  <div className="profile-about-row">
                    <MapPinIcon /> {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="profile-about-row">
                    <LinkIcon />
                    <a href={normalizeUrl(profile.website)} target="_blank" rel="noreferrer">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.createdAt && (
                  <div className="profile-about-row">
                    <CalendarIcon /> {formatJoinDate(profile.createdAt)}
                  </div>
                )}
              </>
            ) : (
              <div className="centered-message">Nothing to show here yet.</div>
            )}
          </div>
        )}
      </div>

      <aside className="profile-side">
        <div className="right-panel-section">
          <div className="right-panel-section-header">
            <span>About</span>
          </div>
          {hasAboutInfo || profile.mutualCount > 0 ? (
            <div className="profile-about-list">
              {profile.location && (
                <div className="profile-about-row">
                  <MapPinIcon /> {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="profile-about-row">
                  <LinkIcon />
                  <a href={normalizeUrl(profile.website)} target="_blank" rel="noreferrer">
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.createdAt && (
                <div className="profile-about-row">
                  <CalendarIcon /> {formatJoinDate(profile.createdAt)}
                </div>
              )}
              {!isOwnProfile && profile.mutualCount > 0 && (
                <div className="profile-about-row">
                  <UsersIcon /> {profile.mutualCount} mutual connection
                  {profile.mutualCount === 1 ? '' : 's'}
                </div>
              )}
            </div>
          ) : (
            <div className="post-time">No details added yet.</div>
          )}
        </div>

        <div className="right-panel-section">
          <div className="right-panel-section-header">
            <span>Photos</span>
            {photos.length > 0 && (
              <button className="see-all-btn" onClick={() => setActiveTab('Posts')}>
                See all
              </button>
            )}
          </div>
          {photos.length === 0 ? (
            <div className="post-time">No photos yet.</div>
          ) : (
            <div className="profile-photos-grid">
              {photos.map((post) => (
                <button
                  key={post._id}
                  type="button"
                  className="profile-photo-thumb"
                  onClick={() => setViewingPostId(post._id)}
                >
                  <img
                    src={post.media?.variants?.thumbnail || post.media?.variants?.original}
                    alt=""
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="right-panel-section">
          <div className="right-panel-section-header">
            <span>Friends</span>
            <Link to="/friends">See all</Link>
          </div>
          {friendsPreview.length === 0 ? (
            <div className="post-time">No friends to show yet.</div>
          ) : (
            <div className="profile-friends-grid">
              {friendsPreview.slice(0, 6).map((f) => (
                <Link key={f._id} to={`/profile/${f.username}`} className="profile-friend">
                  <Avatar src={f.profilePicture} username={f.username} size={48} />
                  <span>{f.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      {editing && (
        <EditProfileModal profile={profile} onClose={() => setEditing(false)} />
      )}

      {followListType && (
        <FollowListModal
          userId={profile._id}
          type={followListType}
          title={followListType === 'followers' ? 'Followers' : 'Following'}
          onClose={() => setFollowListType(null)}
        />
      )}

      {viewingPostId && (
        <PostDetailModal postId={viewingPostId} onClose={() => setViewingPostId(null)} />
      )}
    </div>
  );
}
