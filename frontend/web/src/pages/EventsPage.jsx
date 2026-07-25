import React, { useEffect, useState } from 'react';
import { eventApi } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import { CalendarIcon } from '../components/icons.jsx';

function CreateEventModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await eventApi.createEvent({ name: name.trim(), description, date, location });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>New event</h2>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />

          <label className="form-label">Date & time</label>
          <input
            type="datetime-local"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="form-label">Location</label>
          <input
            className="form-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Optional"
          />

          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && <div className="auth-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="follow-button" disabled={!name.trim() || !date || submitting}>
              {submitting ? 'Creating…' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    eventApi.getEvents().then((res) => setEvents(res?.data || []));
  };

  useEffect(() => {
    setLoading(true);
    eventApi.getEvents().then((res) => setEvents(res?.data || [])).finally(() => setLoading(false));
  }, []);

  const handleRsvp = async (eventId) => {
    setEvents((prev) =>
      prev.map((e) =>
        e._id === eventId
          ? { ...e, isGoing: !e.isGoing, attendeesCount: e.attendeesCount + (e.isGoing ? -1 : 1) }
          : e
      )
    );
    try {
      await eventApi.toggleRsvp(eventId);
    } catch {
      load();
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <h2 className="page-title" style={{ padding: 0 }}>Events</h2>
        <button className="follow-button" onClick={() => setCreating(true)}>
          Create event
        </button>
      </div>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && events.length === 0 && (
        <div className="centered-message">No upcoming events — create one.</div>
      )}

      <div className="card-grid">
        {events.map((e) => (
          <div key={e._id} className="entity-card">
            <div className="entity-card-icon">
              <CalendarIcon />
            </div>
            <div className="entity-card-title">{e.name}</div>
            <div className="post-time">
              {new Date(e.date).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
            {e.location && <div className="post-time">{e.location}</div>}
            {e.description && <div className="entity-card-desc">{e.description}</div>}
            <div className="entity-card-footer">
              <Avatar src={e.host?.profilePicture} username={e.host?.username} size={24} />
              <span className="post-time">
                hosted by {e.host?.username} · {e.attendeesCount} going
              </span>
            </div>
            <button
              className={`follow-button ${e.isGoing ? 'following' : ''}`}
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => handleRsvp(e._id)}
            >
              {e.isGoing ? "You're going" : 'RSVP'}
            </button>
          </div>
        ))}
      </div>

      {creating && (
        <CreateEventModal
          onClose={() => setCreating(false)}
          onCreated={(e) => setEvents((prev) => [{ ...e, attendeesCount: 1, isGoing: true }, ...prev])}
        />
      )}
    </div>
  );
}
