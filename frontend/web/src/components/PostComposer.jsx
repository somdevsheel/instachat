import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { postsApi, fetchFeed } from '@instachat/shared';
import Avatar from './Avatar.jsx';
import { PlusSquareIcon, SmileIcon, MapPinIcon } from './icons.jsx';

const FEELINGS = ['happy', 'sad', 'excited', 'loved', 'grateful', 'tired'];

export default function PostComposer() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setExpanded(false);
    setText('');
    setLocation('');
    setShowLocationInput(false);
    setShowFeelingPicker(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await postsApi.createPost({ caption: trimmed, location: location.trim() });
      reset();
      dispatch(fetchFeed());
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const addFeeling = (feeling) => {
    setText((prev) => (prev ? `${prev} — feeling ${feeling}` : `Feeling ${feeling}`));
    setShowFeelingPicker(false);
  };

  return (
    <div className="composer-card">
      <form onSubmit={handlePost}>
        <div className="composer-top">
          <Avatar src={user?.profilePicture} username={user?.username} size={40} />
          {expanded ? (
            <textarea
              className="composer-textarea"
              placeholder={`What's on your mind, ${user?.username}?`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              rows={3}
            />
          ) : (
            <button
              type="button"
              className="composer-placeholder"
              onClick={() => setExpanded(true)}
            >
              What's on your mind, {user?.username}?
            </button>
          )}
        </div>

        {expanded && showLocationInput && (
          <input
            className="form-input"
            style={{ marginTop: 10 }}
            placeholder="Add a location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        )}

        {expanded && showFeelingPicker && (
          <div className="composer-feeling-picker">
            {FEELINGS.map((f) => (
              <button type="button" key={f} onClick={() => addFeeling(f)}>
                {f}
              </button>
            ))}
          </div>
        )}

        {expanded && (
          <div className="composer-actions">
            <button
              type="button"
              className="composer-inline-action"
              onClick={() => setShowFeelingPicker((v) => !v)}
            >
              Feeling/Activity
            </button>
            <button
              type="button"
              className="composer-inline-action"
              onClick={() => setShowLocationInput((v) => !v)}
            >
              Check In
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="modal-cancel" onClick={reset}>
              Cancel
            </button>
            <button type="submit" className="follow-button" disabled={!text.trim() || submitting}>
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        )}
      </form>

      {!expanded && (
        <div className="composer-quick-actions">
          <button className="composer-quick-action" onClick={() => navigate('/create')}>
            <span className="composer-quick-icon icon-green"><PlusSquareIcon /></span> Photo/Video
          </button>
          <button
            className="composer-quick-action"
            onClick={() => {
              setExpanded(true);
              setShowFeelingPicker(true);
            }}
          >
            <span className="composer-quick-icon icon-amber"><SmileIcon /></span> Feeling/Activity
          </button>
          <button
            className="composer-quick-action"
            onClick={() => {
              setExpanded(true);
              setShowLocationInput(true);
            }}
          >
            <span className="composer-quick-icon icon-red"><MapPinIcon /></span> Check In
          </button>
        </div>
      )}
    </div>
  );
}
