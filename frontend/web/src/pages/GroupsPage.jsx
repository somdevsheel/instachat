import React, { useEffect, useState } from 'react';
import { groupApi } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import { GroupsIcon } from '../components/icons.jsx';

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await groupApi.createGroup({ name: name.trim(), description });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>New group</h2>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />

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
            <button type="submit" className="follow-button" disabled={!name.trim() || submitting}>
              {submitting ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    groupApi.getGroups().then((res) => setGroups(res?.data || []));
  };

  useEffect(() => {
    setLoading(true);
    groupApi.getGroups().then((res) => setGroups(res?.data || [])).finally(() => setLoading(false));
  }, []);

  const handleToggleMembership = async (groupId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, isMember: !g.isMember, membersCount: g.membersCount + (g.isMember ? -1 : 1) }
          : g
      )
    );
    try {
      await groupApi.toggleGroupMembership(groupId);
    } catch {
      load();
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <h2 className="page-title" style={{ padding: 0 }}>Groups</h2>
        <button className="follow-button" onClick={() => setCreating(true)}>
          Create group
        </button>
      </div>

      {loading && <div className="centered-message">Loading…</div>}
      {!loading && groups.length === 0 && (
        <div className="centered-message">No groups yet — start one.</div>
      )}

      <div className="card-grid">
        {groups.map((g) => (
          <div key={g._id} className="entity-card">
            <div className="entity-card-icon">
              <GroupsIcon />
            </div>
            <div className="entity-card-title">{g.name}</div>
            <div className="post-time">{g.membersCount} member{g.membersCount === 1 ? '' : 's'}</div>
            {g.description && <div className="entity-card-desc">{g.description}</div>}
            <div className="entity-card-footer">
              <Avatar src={g.creator?.profilePicture} username={g.creator?.username} size={24} />
              <span className="post-time">by {g.creator?.username}</span>
            </div>
            <button
              className={`follow-button ${g.isMember ? 'following' : ''}`}
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => handleToggleMembership(g._id)}
            >
              {g.isMember ? 'Leave' : 'Join'}
            </button>
          </div>
        ))}
      </div>

      {creating && (
        <CreateGroupModal
          onClose={() => setCreating(false)}
          onCreated={(g) => setGroups((prev) => [{ ...g, membersCount: 1, isMember: true }, ...prev])}
        />
      )}
    </div>
  );
}
