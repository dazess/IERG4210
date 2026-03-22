import { useCallback, useEffect, useState } from 'react';

const API = '';

export default function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState('');
  const [csrfError, setCsrfError] = useState('');

  const refreshCsrfToken = useCallback(async () => {
    try {
      setCsrfError('');
      const res = await fetch(`${API}/api/csrf-token`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.csrfToken) {
        setCsrfToken('');
        setCsrfError(data.error || 'Failed to initialize CSRF protection');
        return '';
      }
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch {
      setCsrfToken('');
      setCsrfError('Failed to initialize CSRF protection');
      return '';
    }
  }, []);

  useEffect(() => {
    refreshCsrfToken();
  }, [refreshCsrfToken]);

  return { csrfToken, csrfError, refreshCsrfToken };
}
