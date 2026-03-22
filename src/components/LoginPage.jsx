import React, { useContext, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';

import { AuthContext } from '../App';
import useCsrfToken from '../hooks/use-csrf-token';
import { sanitizeSingleLineInput } from '../lib/validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const { auth, login } = useContext(AuthContext);
  const { csrfToken, csrfError } = useCsrfToken();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (auth.authenticated) {
    return <Navigate to={auth.user?.isAdmin ? '/admin' : '/'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedEmail = sanitizeSingleLineInput(email, 255).trim().toLowerCase();
    if (!cleanedEmail || !password) {
      setError('Email and password are required');
      return;
    }
    if (!csrfToken) {
      setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    const result = await login({ email: cleanedEmail, password, csrfToken });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Either email or password is incorrect');
      return;
    }

    navigate(result.user?.isAdmin ? '/admin' : '/');
  };

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {csrfError && <p style={{ color: 'red' }}>{csrfError}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
        <input type="hidden" name="csrf_token" value={csrfToken} readOnly />

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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={128}
            required
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
          />
        </label>

        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
