import React, { useState, useEffect, createContext } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';
import Admin from './components/Admin';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import Footer from './components/Footer';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import '../styles/main.css';
import { clampQuantityInput } from './lib/validation';

export const CartContext = createContext(null);
export const AuthContext = createContext(null);

const API = '';

function App() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, user: null });

  async function loadMe() {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'GET',
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setAuth({ loading: false, authenticated: false, user: null });
        return;
      }
      setAuth({ loading: false, authenticated: true, user: data.user });
    } catch {
      setAuth({ loading: false, authenticated: false, user: null });
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const entries = Object.values(cart);
    if (entries.length === 0) return;

    Promise.all(
      entries.map(item =>
        fetch(`${API}/api/products/${item.pid}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      setCart(prev => {
        const updated = { ...prev };
        results.forEach((data, i) => {
          const pid = entries[i].pid;
          if (data && updated[pid]) {
            updated[pid] = { ...updated[pid], name: data.name, price: data.price };
          }
        });
        return updated;
      });
    });
  }, []);

  function addToCart(product, qty) {
    const amount = clampQuantityInput(qty);
    setCart(prev => {
      const existing = prev[product.pid];
      const existingQty = existing ? clampQuantityInput(existing.qty) : 0;
      return {
        ...prev,
        [product.pid]: {
          pid:   product.pid,
          name:  product.name,
          price: product.price,
          qty:   clampQuantityInput(existingQty + amount),
        },
      };
    });
  }

  function updateQty(pid, qty) {
    const next = clampQuantityInput(qty);
    setCart(prev => {
      const updated = { ...prev, [pid]: { ...prev[pid], qty: next } };
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  }

  function removeFromCart(pid) {
    setCart(prev => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  }

  async function login({ email, password, csrfToken }) {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, csrf_token: csrfToken }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Login failed' };
      setAuth({ loading: false, authenticated: true, user: data.user });
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: 'Login failed' };
    }
  }

  async function register({ displayName, email, password, passwordConfirm, csrfToken }) {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          displayName,
          email,
          password,
          passwordConfirm,
          csrf_token: csrfToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Registration failed' };
      setAuth({ loading: false, authenticated: true, user: data.user });
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: 'Registration failed' };
    }
  }

  async function logout(csrfToken) {
    try {
      const res = await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Logout failed' };
      }
      setAuth({ loading: false, authenticated: false, user: null });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Logout failed' };
    }
  }

  async function changePassword({ currentPassword, newPassword, newPasswordConfirm, csrfToken }) {
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm,
          csrf_token: csrfToken,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'Change password failed' };

      setAuth({ loading: false, authenticated: false, user: null });
      return { ok: true, message: data.message || 'Password changed successfully' };
    } catch {
      return { ok: false, error: 'Change password failed' };
    }
  }

  if (auth.loading) {
    return <main style={{ padding: '2rem', color: 'white' }}>Loading...</main>;
  }

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, changePassword, reloadAuth: loadMe }}>
      <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart }}>
        <Router>
          <Header />
          <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/product/:pid" element={<ProductPage />} />
            <Route
              path="/admin"
              element={auth.authenticated && auth.user?.isAdmin ? <Admin /> : <Navigate to="/login" replace />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/account"
              element={auth.authenticated ? <ChangePasswordPage /> : <Navigate to="/login" replace />}
            />
          </Routes>
          <Footer />
        </Router>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
