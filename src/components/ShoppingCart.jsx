import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../App';
import { MAX_QTY, sanitizeDisplayText } from '../lib/validation';

export default function ShoppingCart({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { cart, updateQty, removeFromCart } = useContext(CartContext);
  const items = Object.values(cart);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }
    onClose(); // Close the cart drawer
    navigate('/checkout');
  };

  return (
    <div className="shopping-cart" style={{ right: isOpen ? '0' : '-400px' }}>
      <div className="cart-content">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close shopping cart">&times;</button>
        </div>
        <div className="cart-items">
          {items.length === 0
            ? <p>Your cart is empty.</p>
            : items.map(item => (
                <div key={item.pid} className="cart-item">
                  <span className="item-name">{sanitizeDisplayText(item.name, 255)}</span>

                  <div className="item-qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.pid, item.qty - 1)}
                      disabled={item.qty <= 1}
                    >−</button>
                    <input
                      type="number"
                      className="qty-input"
                      min="1"
                      max={MAX_QTY}
                      inputMode="numeric"
                      value={item.qty}
                      onChange={e => updateQty(item.pid, e.target.value)}
                    />
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.pid, item.qty + 1)}
                    >+</button>
                  </div>

                  <span className="item-price">${Number(item.price * item.qty).toLocaleString()}</span>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.pid)}
                    title="Remove item"
                  >✕</button>
                </div>
              ))
          }
        </div>
        <div className="cart-total">
          <strong className="text-black">Total: ${Number(total).toLocaleString()}</strong>
          <br />
          <br />
          <button 
            className="checkout-button"
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
