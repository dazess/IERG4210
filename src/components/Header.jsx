import React from 'react';
import ShoppingCart from './ShoppingCart';
export default function Header() {
  return (
    <header className="header">
      <nav className="navbar ">
        <a href="/" className="logo">Legendary MOTORSPORT</a>
        <div className="cart-wrapper">
          <input type="checkbox" id="cart-toggle" className="cart-toggle-checkbox" />
          <label htmlFor="cart-toggle" className="cart-button">
            Shopping Cart
          </label>
          <ShoppingCart/>
        </div>
      </nav>
    </header>
  );
}
