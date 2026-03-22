import React, { useEffect, useState } from 'react';
import { sanitizeSingleLineInput, sanitizeDisplayText } from '../../lib/validation';
import useCsrfToken from '../../hooks/use-csrf-token';

const API = '';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName]             = useState('');
  const [editId, setEditId]         = useState(null);
  const [error, setError]           = useState('');
  const { csrfToken, csrfError } = useCsrfToken();

  const load = () =>
    fetch(`${API}/api/categories`).then(r => r.json()).then(setCategories).catch(console.error);

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanedName = sanitizeSingleLineInput(name, 255).trim();
    if (!cleanedName) {
      setError('Category name is required');
      return;
    }

    const method = editId ? 'PUT' : 'POST';
    const url    = editId ? `${API}/api/categories/${editId}` : `${API}/api/categories`;
    if (!csrfToken) {
      setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
      return;
    }

    const res  = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ name: cleanedName, csrf_token: csrfToken }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Request failed'); return; }
    setName('');
    setEditId(null);
    load();
  };

  const handleEdit = (cat) => { setEditId(cat.catid); setName(cat.name); setError(''); };

  const handleDelete = async (catid) => {
    if (!confirm('Delete this category? This will fail if products are assigned to it.')) return;
    if (!csrfToken) {
      setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
      return;
    }
    const res  = await fetch(`${API}/api/categories/${catid}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Delete failed'); return; }
    load();
  };

  const handleCancel = () => { setEditId(null); setName(''); setError(''); };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Categories</h2>

      {error && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>}
      {csrfError && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{csrfError}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input type="hidden" name="csrf_token" value={csrfToken} readOnly />
        <label>
          Category name:&nbsp;
          <input
            type="text"
            value={name}
            onChange={e => setName(sanitizeSingleLineInput(e.target.value, 255))}
            maxLength={255}
            pattern=".*\S.*"
            required
            style={{ padding: '0.3rem 0.5rem' }}
          />
        </label>
        <button type="submit" style={{ padding: '0.3rem 0.8rem' }}>
          {editId ? 'Update' : 'Insert'}
        </button>
        {editId && (
          <button type="button" onClick={handleCancel} style={{ padding: '0.3rem 0.8rem' }}>
            Cancel
          </button>
        )}
      </form>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.catid}>
              <td style={td}>{cat.catid}</td>
              <td style={td}>{sanitizeDisplayText(cat.name, 255)}</td>
              <td style={td}>
                <button onClick={() => handleEdit(cat)} style={{ marginRight: '0.4rem' }}>Edit</button>
                <button onClick={() => handleDelete(cat.catid)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { border: '1px solid #555', padding: '0.4rem 0.8rem', background: '#333', textAlign: 'left' };
const td = { border: '1px solid #555', padding: '0.4rem 0.8rem' };
