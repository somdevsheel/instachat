import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { postsApi, reelsApi, storyApi, addStory, fetchFeed } from '@instachat/shared';
import { uploadMediaFile } from '../utils/uploadMedia.js';
import { getVideoDuration } from '../utils/getVideoDuration.js';

const MODES = ['post', 'reel', 'story'];

export default function CreatePostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState(MODES.includes(location.state?.mode) ? location.state.mode : 'post');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (next) => {
    setMode(next);
    setFile(null);
    setPreviewUrl(null);
    setError('');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (mode === 'reel' && !selected.type.startsWith('video')) {
      setError('Reels must be a video file');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError('');
  };

  const handleSharePost = async () => {
    const { key, mediaType } = await uploadMediaFile(file);
    await postsApi.createPost({
      caption,
      media: { type: mediaType, originalKey: key },
    });
    dispatch(fetchFeed());
    navigate('/', { replace: true });
  };

  const handleShareStory = async () => {
    const { key, mediaType } = await uploadMediaFile(file);
    const res = await storyApi.createStoryRecord({ key, mediaType });
    if (res?.data) dispatch(addStory(res.data));
    navigate('/', { replace: true });
  };

  const handleShareReel = async () => {
    const duration = await getVideoDuration(file);

    let presignRes;
    try {
      presignRes = await reelsApi.getReelPresignedUrl(file.type, file.size / (1024 * 1024));
    } catch (err) {
      throw new Error(
        err?.response?.data?.message || `Could not get an upload URL (${err.message})`
      );
    }
    const { uploadUrl, key } = presignRes.data;

    try {
      await reelsApi.uploadVideoToS3(uploadUrl, previewUrl, file.type);
    } catch (err) {
      throw new Error(`Upload to storage failed (${err.message})`);
    }

    try {
      await reelsApi.createReel({ videoKey: key, caption, duration });
    } catch (err) {
      throw new Error(
        err?.response?.data?.message || `Video uploaded but saving the reel failed (${err.message})`
      );
    }

    navigate('/reels', { replace: true });
  };

  const handleShare = async () => {
    if (!file) return;
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'reel') {
        await handleShareReel();
      } else if (mode === 'story') {
        await handleShareStory();
      } else {
        await handleSharePost();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || `Failed to create ${mode}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-page">
      <h2 className="page-title">New {mode}</h2>

      <div className="create-tabs">
        <button
          className={`create-tab ${mode === 'post' ? 'active' : ''}`}
          onClick={() => switchMode('post')}
        >
          Post
        </button>
        <button
          className={`create-tab ${mode === 'reel' ? 'active' : ''}`}
          onClick={() => switchMode('reel')}
        >
          Reel
        </button>
        <button
          className={`create-tab ${mode === 'story' ? 'active' : ''}`}
          onClick={() => switchMode('story')}
        >
          Story
        </button>
      </div>

      <div className="create-card">
        {!previewUrl ? (
          <div className="create-dropzone" onClick={() => fileInputRef.current?.click()}>
            <p>{mode === 'reel' ? 'Click to select a video' : 'Click to select a photo or video'}</p>
          </div>
        ) : (
          <div className="create-preview">
            {file.type.startsWith('video') ? (
              <video src={previewUrl} controls />
            ) : (
              <img src={previewUrl} alt="preview" />
            )}
            <button
              className="create-change-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={mode === 'reel' ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime'}
          onChange={handleFileChange}
          hidden
        />

        {mode !== 'story' && (
          <textarea
            className="create-caption"
            placeholder="Write a caption…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />
        )}

        {error && <div className="auth-error">{error}</div>}

        <button
          className="follow-button create-share-button"
          onClick={handleShare}
          disabled={!file || submitting}
        >
          {submitting ? 'Sharing…' : 'Share'}
        </button>
      </div>
    </div>
  );
}
