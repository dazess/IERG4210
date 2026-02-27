import React, { useState } from 'react';
import ShoppingCart from './ShoppingCart';

export default function Header() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <header className="header">
      <nav className="navbar ">
        <a href="/" className="logo">Legendary MOTORSPORT</a>
        <div className="cart-wrapper">
          <button className="cart-button" onClick={() => setCartOpen(open => !open)}>
            Shopping Cart
          </button>
          <button className="admin-button" onClick={() => window.location.href = '/admin'}>
            Admin
          </button>
          <ShoppingCart isOpen={cartOpen} />
        </div>
      </nav>
    </header>
  );
}
