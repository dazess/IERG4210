import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AuthContext } from '../App';
import useCsrfToken from '../hooks/use-csrf-token';
import { sanitizeSingleLineInput } from '../lib/validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { auth, register } = useContext(AuthContext);
  const { csrfToken, csrfError } = useCsrfToken();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (auth.authenticated) {
    return <Navigate to={auth.user?.isAdmin ? '/admin' : '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedName = sanitizeSingleLineInput(displayName, 255).trim();
    const cleanedEmail = sanitizeSingleLineInput(email, 255).trim().toLowerCase();

    if (!cleanedName || !cleanedEmail || !password || !passwordConfirm) {
      setError('All fields are required');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (!csrfToken) {
      setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      displayName: cleanedName,
      email: cleanedEmail,
      password,
      passwordConfirm,
      csrfToken,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Registration failed');
      return;
    }

    navigate('/');
  };

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Register</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {csrfError && <p style={{ color: 'red' }}>{csrfError}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
        <input type="hidden" name="csrf_token" value={csrfToken} readOnly />

        <label>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(sanitizeSingleLineInput(e.target.value, 255))}
            maxLength={255}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(sanitizeSingleLineInput(e.target.value, 255))}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}
