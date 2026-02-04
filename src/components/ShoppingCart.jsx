import React from 'react';

export default function ShoppingCart() {
  return (
    <div className="shopping-cart">
      <div className="cart-content">
        <h2>Shopping Cart (placeholder content)</h2>
        <div className="cart-items">
          <div className="cart-item">
            <span className="item-name">KARIN 190Z</span>
            <span className="item-qty">Qty: 1</span>
            <span className="item-price ">$1,900,220</span>
          </div>
        </div>
        <div className="cart-total">
          <strong className='text-black'>Total: $1,900,220</strong>
          <br></br>
          <br></br>
          <button className="checkout-button">Checkout</button>
        </div>
      </div>
    </div>
  );
}
