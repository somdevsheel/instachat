import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userApi, logout } from '@instachat/shared';

const TABS = ['Account', 'Privacy', 'Security'];

const GENDER_OPTIONS = [
  { label: 'Prefer not to say', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

function formatDateInput(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().slice(0, 10);
}

function AccountTab() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    name: '',
    gender: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    userApi
      .getAccountInfo()
      .then((res) => {
        const data = res?.data || {};
        setForm({
          username: data.username || '',
          email: data.email || '',
          phone: data.phone || '',
          name: data.name || '',
          gender: data.gender || '',
          dateOfBirth: formatDateInput(data.dateOfBirth),
        });
      })
      .catch(() => setError('Failed to load account info'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await userApi.updateAccountInfo(form);
      setMessage('Account info updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update account info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="centered-message">Loading…</div>;

  return (
    <form className="settings-form" onSubmit={handleSave}>
      <label className="form-label">Username</label>
      <input className="form-input" value={form.username} onChange={handleChange('username')} />

      <label className="form-label">Name</label>
      <input className="form-input" value={form.name} onChange={handleChange('name')} />

      <label className="form-label">Email</label>
      <input className="form-input" type="email" value={form.email} onChange={handleChange('email')} />

      <label className="form-label">Phone</label>
      <input className="form-input" value={form.phone} onChange={handleChange('phone')} />

      <label className="form-label">Gender</label>
      <select className="form-input" value={form.gender} onChange={handleChange('gender')}>
        {GENDER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <label className="form-label">Date of birth</label>
      <input
        className="form-input"
        type="date"
        value={form.dateOfBirth}
        onChange={handleChange('dateOfBirth')}
      />

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="settings-success">{message}</div>}

      <button type="submit" className="follow-button settings-save-btn" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function PrivacyTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi
      .getPrivacySettings()
      .then((res) => setSettings(res?.data || {}))
      .catch(() => setError('Failed to load privacy settings'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (field) => {
    const next = { ...settings, [field]: !settings[field] };
    setSettings(next);
    setSaving(true);
    setError('');
    try {
      await userApi.updatePrivacySettings({ [field]: next[field] });
    } catch (err) {
      setSettings(settings); // revert
      setError(err?.response?.data?.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="centered-message">Loading…</div>;
  if (!settings) return <div className="centered-message">{error}</div>;

  return (
    <div className="settings-form">
      <ToggleRow
        label="Private account"
        description="Only approved followers can see your posts"
        value={settings.isPrivate}
        onToggle={() => toggle('isPrivate')}
        disabled={saving}
      />
      <ToggleRow
        label="Show activity status"
        description="Let others see when you're online"
        value={settings.activityStatusVisible}
        onToggle={() => toggle('activityStatusVisible')}
        disabled={saving}
      />
      <ToggleRow
        label="Show read receipts"
        description="Let people know when you've seen their messages"
        value={settings.showReadReceipts}
        onToggle={() => toggle('showReadReceipts')}
        disabled={saving}
      />
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

function ToggleRow({ label, description, value, onToggle, disabled }) {
  return (
    <div className="settings-toggle-row">
      <div>
        <div className="settings-toggle-label">{label}</div>
        {description && <div className="settings-toggle-desc">{description}</div>}
      </div>
      <button
        type="button"
        className={`settings-switch ${value ? 'on' : ''}`}
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={value}
      >
        <span className="settings-switch-knob" />
      </button>
    </div>
  );
}

function SecurityTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [togglingTwoFactor, setTogglingTwoFactor] = useState(false);

  const [loginActivity, setLoginActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    userApi
      .getLoginActivity()
      .then((res) => setLoginActivity(res?.data || []))
      .catch(() => {})
      .finally(() => setLoadingActivity(false));

    // toggleTwoFactor() only flips the value — the current state has to
    // come from account info, otherwise this always renders "off" again
    // on every mount (e.g. after a page refresh).
    userApi
      .getAccountInfo()
      .then((res) => setTwoFactorEnabled(!!res?.data?.twoFactorEnabled))
      .catch(() => {});
  }, []);

  const handlePasswordChange = (field) => (e) => {
    setPasswordForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await userApi.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setTogglingTwoFactor(true);
    try {
      const res = await userApi.toggleTwoFactor();
      setTwoFactorEnabled(res.twoFactorEnabled);
    } catch {
      // leave as-is on failure
    } finally {
      setTogglingTwoFactor(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await userApi.deleteAccount(deletePassword);
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-form">
      <h3 className="settings-section-title">Change password</h3>
      <form onSubmit={handlePasswordSave}>
        <label className="form-label">Current password</label>
        <input
          className="form-input"
          type="password"
          value={passwordForm.currentPassword}
          onChange={handlePasswordChange('currentPassword')}
        />
        <label className="form-label">New password</label>
        <input
          className="form-input"
          type="password"
          value={passwordForm.newPassword}
          onChange={handlePasswordChange('newPassword')}
        />
        <label className="form-label">Confirm new password</label>
        <input
          className="form-input"
          type="password"
          value={passwordForm.confirmPassword}
          onChange={handlePasswordChange('confirmPassword')}
        />

        {passwordError && <div className="auth-error">{passwordError}</div>}
        {passwordMessage && <div className="settings-success">{passwordMessage}</div>}

        <button type="submit" className="follow-button settings-save-btn" disabled={savingPassword}>
          {savingPassword ? 'Saving…' : 'Update password'}
        </button>
      </form>

      <h3 className="settings-section-title">Two-factor authentication</h3>
      <ToggleRow
        label="Two-factor authentication"
        description="Require a one-time code in addition to your password"
        value={twoFactorEnabled}
        onToggle={handleToggleTwoFactor}
        disabled={togglingTwoFactor}
      />

      <h3 className="settings-section-title">Login activity</h3>
      {loadingActivity && <div className="centered-message">Loading…</div>}
      {!loadingActivity && loginActivity.length === 0 && (
        <div className="post-time">No login activity recorded yet.</div>
      )}
      {!loadingActivity && loginActivity.length > 0 && (
        <ul className="login-activity-list">
          {loginActivity.map((entry, i) => (
            <li key={i} className="login-activity-row">
              <div>
                <div className="post-username">
                  {entry.device || 'Unknown device'}
                  {entry.isCurrent && <span className="settings-current-badge">This device</span>}
                </div>
                <div className="post-time">{entry.location || 'Unknown location'}</div>
              </div>
              <div className="post-time">
                {entry.loginAt ? new Date(entry.loginAt).toLocaleString() : ''}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="settings-section-title danger">Danger zone</h3>
      {!showDeleteConfirm ? (
        <button
          type="button"
          className="follow-button danger-btn"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete account
        </button>
      ) : (
        <div className="settings-delete-confirm">
          <p>
            This permanently deletes your account and can't be undone. Enter your password to
            confirm.
          </p>
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          {deleteError && <div className="auth-error">{deleteError}</div>}
          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletePassword('');
                setDeleteError('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="follow-button danger-btn"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Permanently delete account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Account');

  return (
    <div className="profile-page settings-page">
      <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>
        Settings
      </h2>

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

      {activeTab === 'Account' && <AccountTab />}
      {activeTab === 'Privacy' && <PrivacyTab />}
      {activeTab === 'Security' && <SecurityTab />}
    </div>
  );
}
