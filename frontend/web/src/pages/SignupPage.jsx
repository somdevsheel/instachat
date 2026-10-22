import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@instachat/shared';

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authApi.requestRegisterOtp(email.trim().toLowerCase());
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authApi.verifyRegisterOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        username,
        fullName,
        acceptedTerms,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid or expired code');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Verify email</h1>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleVerifyOtp}>
            <p style={{ fontSize: 13, color: '#8e8e8e', marginBottom: 10 }}>
              Code sent to {email}
            </p>
            <input
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign up</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleRequestOtp}>
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className="auth-consent">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <span>
              I'm at least 13 and agree to the{' '}
              <Link to="/terms" target="_blank">Terms</Link> and{' '}
              <Link to="/privacy" target="_blank">Privacy Policy</Link>
            </span>
          </label>
          <button type="submit" disabled={submitting || !acceptedTerms}>
            {submitting ? 'Sending code…' : 'Sign up'}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
