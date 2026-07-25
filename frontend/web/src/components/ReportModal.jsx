import React, { useState } from 'react';
import { reportApi } from '@instachat/shared';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence' },
  { value: 'nudity', label: 'Nudity' },
  { value: 'false_information', label: 'False information' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'intellectual_property', label: 'Intellectual property violation' },
  { value: 'self_harm', label: 'Self-harm' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    setError('');
    try {
      await reportApi.submitReport({ targetType, targetId, reason, description });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <>
            <h2 className="page-title" style={{ padding: 0, marginBottom: 12 }}>
              Report submitted
            </h2>
            <p className="post-time">Thanks — our team will review this.</p>
            <div className="modal-actions">
              <button className="follow-button" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>
              Report {targetType}
            </h2>

            {REASONS.map((r) => (
              <label key={r.value} className="report-reason-option">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}

            <label className="form-label">Additional details (optional)</label>
            <textarea
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {error && <div className="auth-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="follow-button" disabled={!reason || submitting}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
