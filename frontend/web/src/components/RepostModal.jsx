import React, { useState } from 'react';

export default function RepostModal({ onClose, onConfirm, label = 'post' }) {
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(caption.trim());
      onClose();
    } catch {
      setError('Repost failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>
          Repost this {label}
        </h2>

        <textarea
          className="repost-caption-input"
          placeholder="Add a caption (optional)…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          maxLength={2200}
          autoFocus
        />

        {error && <div className="post-time" style={{ color: '#ed4956' }}>{error}</div>}

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="follow-button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Reposting…' : 'Repost'}
          </button>
        </div>
      </div>
    </div>
  );
}
