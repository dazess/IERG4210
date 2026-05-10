import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import useCsrfToken from "@/hooks/use-csrf-token";

const API = '';

export default function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const { toast } = useToast();
  const { csrfToken } = useCsrfToken();

  function loadSessions() {
    fetch(`${API}/api/auth/sessions`)
      .then(r => r.json())
      .then(setSessions)
      .catch(console.error);
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function revokeSession(sessionId) {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    try {
      const res = await fetch(`${API}/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });
      if (res.ok) {
        toast({ title: 'Session revoked successfully' });
        loadSessions();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to revoke session', description: err.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error revoking session', variant: 'destructive' });
    }
  }

  return (
    <div style={{ background: '#2c1e16', padding: '1rem', borderRadius: '8px' }}>
      <h2>Active Sessions</h2>
      <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #666', background: '#3e2a22' }}>
            <th style={{ padding: '0.5rem' }}>User Email</th>
            <th>IP Address</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.session_id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '0.5rem' }}>{s.email}</td>
              <td>{s.ip_address}</td>
              <td>{new Date(s.created_at + 'Z').toLocaleString()}</td>
              <td>
                <Button variant="destructive" size="sm" onClick={() => revokeSession(s.session_id)}>Revoke</Button>
              </td>
            </tr>
          ))}
          {sessions.length === 0 && (
            <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No active sessions found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
