import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProfile } from '@instachat/shared';
import { uploadMediaFile } from '../utils/uploadMedia.js';
import Avatar from './Avatar.jsx';

export default function EditProfileModal({ profile, onClose }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.profilePicture);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let avatarKey;
      if (avatarFile) {
        const { key } = await uploadMediaFile(avatarFile);
        avatarKey = key;
      }

      const payload = {
        username: username.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
      };
      if (avatarKey) payload.avatarKey = avatarKey;

      const result = await dispatch(updateProfile(payload));
      if (updateProfile.rejected.match(result)) {
        setError(result.payload || 'Failed to update profile');
        return;
      }

      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>
          Edit profile
        </h2>

        <form onSubmit={handleSave}>
          <div className="edit-avatar-row">
            <Avatar src={avatarPreview} username={username} size={64} />
            <button
              type="button"
              className="follow-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />
          </div>

          <label className="form-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
          />

          <label className="form-label">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="form-input"
            rows={3}
          />

          <label className="form-label">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="form-input"
            placeholder="Where are you based?"
          />

          <label className="form-label">Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="form-input"
            placeholder="yourwebsite.com"
          />

          {error && <div className="auth-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="follow-button" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
