import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AuthContext } from '../App';
import useCsrfToken from '../hooks/use-csrf-token';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { auth, changePassword } = useContext(AuthContext);
  const { csrfToken, csrfError, refreshCsrfToken } = useCsrfToken();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!auth.authenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('New passwords do not match');
      return;
    }

    const latestToken = (await refreshCsrfToken()) || csrfToken;
    if (!latestToken) {
      setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      newPasswordConfirm,
      csrfToken: latestToken,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Change password failed');
      return;
    }

    setMessage(result.message || 'Password changed successfully. Please login again.');
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    navigate('/login', { replace: true });
  };

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Change Password</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: '#90ee90' }}>{message}</p>}
      {csrfError && <p style={{ color: 'red' }}>{csrfError}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
        <input type="hidden" name="csrf_token" value={csrfToken} readOnly />

        <label>
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        <Link to="/">Back to home</Link>
      </p>
    </main>
  );
}
