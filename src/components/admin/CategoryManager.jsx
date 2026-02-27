import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName]             = useState('');
  const [editId, setEditId]         = useState(null);
  const [error, setError]           = useState('');

  const load = () =>
    fetch(`${API}/api/categories`).then(r => r.json()).then(setCategories).catch(console.error);

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const method = editId ? 'PUT' : 'POST';
    const url    = editId ? `${API}/api/categories/${editId}` : `${API}/api/categories`;
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
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
    const res  = await fetch(`${API}/api/categories/${catid}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Delete failed'); return; }
    load();
  };

  const handleCancel = () => { setEditId(null); setName(''); setError(''); };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Categories</h2>

      {error && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label>
          Category name:&nbsp;
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={255}
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
              <td style={td}>{cat.name}</td>
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
