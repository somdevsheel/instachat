import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, verify2FA, clear2FA } from '@instachat/shared';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requires2FA, twoFactorEmail, twoFactorTempUserId, isAuthenticated } =
    useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await dispatch(loginUser({ email, password }));

    setSubmitting(false);
    if (loginUser.rejected.match(result)) {
      setError(result.payload || 'Login failed');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await dispatch(
      verify2FA({
        email: twoFactorEmail,
        otp,
        tempUserId: twoFactorTempUserId,
      })
    );

    setSubmitting(false);
    if (verify2FA.rejected.match(result)) {
      setError(result.payload || 'Verification failed');
    } else {
      navigate('/', { replace: true });
    }
  };

  if (requires2FA) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Verify</h1>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleVerify}>
            <p style={{ fontSize: 13, color: '#8e8e8e', marginBottom: 10 }}>
              Code sent to {twoFactorEmail}
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
              {submitting ? 'Verifying…' : 'Verify & Sign In'}
            </button>
          </form>
          <div className="auth-switch">
            <button
              type="button"
              onClick={() => dispatch(clear2FA())}
              style={{
                background: 'none',
                border: 'none',
                color: '#3797ef',
                cursor: 'pointer',
                width: 'auto',
              }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="" className="auth-logo-mark" />
          <h1>Nebula</h1>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleLogin}>
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
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log In'}
          </button>
        </form>
        <div className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
