import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShoppingCart from './ShoppingCart';
import { AuthContext } from '../App';
import useCsrfToken from '../hooks/use-csrf-token';

export default function Header() {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const { auth, logout } = useContext(AuthContext);
  const { csrfToken, refreshCsrfToken } = useCsrfToken();

  useEffect(() => {
    refreshCsrfToken();
  }, [auth.authenticated, refreshCsrfToken]);

  const handleLogout = async () => {
    const latestToken = (await refreshCsrfToken()) || csrfToken;
    if (!latestToken) return;
    const result = await logout(latestToken);
    if (result.ok) {
      navigate('/');
    }
  };

  return (
    <header className="header">
      <nav className="navbar ">
        <Link to="/" className="logo">Legendary MOTORSPORT</Link>
        <div className="cart-wrapper">
          <span style={{ color: 'white', marginRight: '0.75rem' }}>
            {auth.authenticated ? (auth.user?.displayName || auth.user?.email) : 'guest'}
          </span>
          <button className="cart-button" onClick={() => setCartOpen(open => !open)}>
            Shopping Cart
          </button>
          {auth.authenticated && auth.user?.isAdmin && (
            <button className="admin-button" onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
          {auth.authenticated && (
            <button className="admin-button" onClick={() => navigate('/account')}>
              Account
            </button>
          )}
          {!auth.authenticated && (
            <>
              <button className="admin-button" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="admin-button" onClick={() => navigate('/register')}>
                Register
              </button>
            </>
          )}
          {auth.authenticated && (
            <button className="admin-button" onClick={handleLogout}>
              Logout
            </button>
          )}
          <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      </nav>
    </header>
  );
}
