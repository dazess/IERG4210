import React, { useEffect, useRef, useState } from 'react';
import {
  normalizeMoneyInput,
  sanitizeDescriptionInput,
  sanitizeSingleLineInput,
  sanitizeDisplayText,
  sanitizeImageIdForPath,
} from '../../lib/validation';
import useCsrfToken from '../../hooks/use-csrf-token';

const API  = '';
const EMPTY = { catid: '', name: '', price: '', description: '' };

export default function ProductManager() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [form,       setForm]       = useState(EMPTY);
  const [editId,     setEditId]     = useState(null);
  const [errors,     setErrors]     = useState([]);
  const fileRef = useRef();
  const { csrfToken, csrfError } = useCsrfToken();

  const isAllowedImageType = (file) => {
    if (!file) return true;
    return ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
  };

  const isAllowedImageSize = (file) => {
    if (!file) return true;
    return file.size <= 10 * 1024 * 1024;
  };

  const loadProducts   = () => fetch(`${API}/api/products`).then(r => r.json()).then(setProducts).catch(console.error);
  const loadCategories = () => fetch(`${API}/api/categories`).then(r => r.json()).then(setCategories).catch(console.error);

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const cleanedName = sanitizeSingleLineInput(form.name, 255).trim();
    const cleanedDescription = sanitizeDescriptionInput(form.description, 1000).trim();
    const normalizedPrice = normalizeMoneyInput(form.price);
    const selectedImage = fileRef.current?.files[0];

    if (!form.catid) {
      setErrors(['Category is required']);
      return;
    }
    if (!cleanedName) {
      setErrors(['Product name is required']);
      return;
    }
    if (normalizedPrice === null || normalizedPrice === '') {
      setErrors(['Price must be a valid amount with up to 2 decimal places']);
      return;
    }
    if (!editId && !selectedImage) {
      setErrors(['Image is required for new products']);
      return;
    }
    if (selectedImage && !isAllowedImageType(selectedImage)) {
      setErrors(['Image type must be jpg, jpeg, png, or gif']);
      return;
    }
    if (selectedImage && !isAllowedImageSize(selectedImage)) {
      setErrors(['Image must be 10MB or smaller']);
      return;
    }
    if (!csrfToken) {
      setErrors([csrfError || 'CSRF token unavailable. Please refresh and try again.']);
      return;
    }

    const fd = new FormData();
    fd.append('catid',       form.catid);
    fd.append('name',        cleanedName);
    fd.append('price',       normalizedPrice);
    fd.append('description', cleanedDescription);
    fd.append('csrf_token',  csrfToken);
    if (selectedImage) {
      fd.append('image', selectedImage);
    }

    const method = editId ? 'PUT' : 'POST';
    const url    = editId ? `${API}/api/products/${editId}` : `${API}/api/products`;

    const res  = await fetch(url, {
      method,
      headers: { 'X-CSRF-Token': csrfToken },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors(data.errors ? data.errors : [data.error]);
      return;
    }

    setForm(EMPTY);
    setEditId(null);
    if (fileRef.current) fileRef.current.value = '';
    loadProducts();
  };

  const handleEdit = (p) => {
    setEditId(p.pid);
    setForm({ catid: p.catid, name: p.name, price: p.price, description: p.description });
    setErrors([]);
  };

  const handleDelete = async (pid) => {
    if (!confirm('Delete this product?')) return;
    if (!csrfToken) {
      setErrors([csrfError || 'CSRF token unavailable. Please refresh and try again.']);
      return;
    }
    const res  = await fetch(`${API}/api/products/${pid}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    const data = await res.json();
    if (!res.ok) { setErrors([data.error || 'Delete failed']); return; }
    loadProducts();
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(EMPTY);
    setErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Products</h2>

      {errors.length > 0 && (
        <ul style={{ color: 'red', marginBottom: '0.5rem' }}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      {csrfError && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{csrfError}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.6rem', maxWidth: '480px' }}>
        <input type="hidden" name="csrf_token" value={csrfToken} readOnly />
        {/* Category dropdown */}
        <label>
          Category:&nbsp;
          <select
            value={form.catid}
            onChange={e => setForm({ ...form, catid: e.target.value })}
            required
            style={{ padding: '0.3rem' }}
          >
            <option value="">-- Select --</option>
            {categories.map(c => (
              <option key={c.catid} value={c.catid}>{c.name}</option>
            ))}
          </select>
        </label>

        <label>
          Name:&nbsp;
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: sanitizeSingleLineInput(e.target.value, 255) })}
            maxLength={255}
            pattern=".*\S.*"
            required
            style={{ padding: '0.3rem', width: '100%' }}
          />
        </label>

        <label>
          Price ($):&nbsp;
          <input
            type="number"
            value={form.price}
            onChange={e => {
              const next = normalizeMoneyInput(e.target.value);
              if (next !== null) {
                setForm({ ...form, price: next });
              }
            }}
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            style={{ padding: '0.3rem' }}
          />
        </label>

        <label>
          Description:
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: sanitizeDescriptionInput(e.target.value, 1000) })}
            maxLength={1000}
            rows={3}
            style={{ display: 'block', width: '100%', padding: '0.3rem' }}
          />
        </label>

        <label>
          Image {editId ? '(leave blank to keep existing)' : '(required, max 10 MB — jpg/jpeg/png/gif)'}:
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            ref={fileRef}
            required={!editId}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!isAllowedImageType(file)) {
                setErrors(['Image type must be jpg, jpeg, png, or gif']);
                e.target.value = '';
                return;
              }
              if (!isAllowedImageSize(file)) {
                setErrors(['Image must be 10MB or smaller']);
                e.target.value = '';
                return;
              }
              setErrors([]);
            }}
            style={{ display: 'block', marginTop: '0.2rem' }}
          />
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" style={{ padding: '0.4rem 1rem' }}>
            {editId ? 'Update Product' : 'Insert Product'}
          </button>
          {editId && (
            <button type="button" onClick={handleCancel} style={{ padding: '0.4rem 1rem' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={th}>PID</th>
            <th style={th}>Name</th>
            <th style={th}>Category</th>
            <th style={th}>Price</th>
            <th style={th}>Thumb</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.pid}>
              <td style={td}>{p.pid}</td>
              <td style={td}>{sanitizeDisplayText(p.name, 255)}</td>
              <td style={td}>{p.catid}</td>
              <td style={td}>${Number(p.price).toLocaleString()}</td>
              <td style={td}>
                {sanitizeImageIdForPath(p.image) && (
                  <img
                    src={`${API}/uploads/${encodeURIComponent(sanitizeImageIdForPath(p.image))}_thumb.jpg`}
                    alt=""
                    style={{ width: 60, height: 40, objectFit: 'cover' }}
                  />
                )}
              </td>
              <td style={td}>
                <button onClick={() => handleEdit(p)} style={{ marginRight: '0.4rem' }}>Edit</button>
                <button onClick={() => handleDelete(p.pid)}>Delete</button>
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
