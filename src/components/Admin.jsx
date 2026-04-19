import React, { useState } from 'react';
import CategoryManager from './admin/CategoryManager';
import ProductManager from './admin/ProductManager';
import OrderManager from './admin/OrderManager';

export default function Admin() {
  const [tab, setTab] = useState('products');

  return (
    <main style={{ padding: '2rem', color: 'white' }}>
      <h1 style={{ marginBottom: '1rem' }}>Admin Panel</h1>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setTab('products')}
          style={{ fontWeight: tab === 'products' ? 'bold' : 'normal',
                   padding: '0.4rem 1rem', cursor: 'pointer' }}
        >
          Products
        </button>
        <button
          onClick={() => setTab('categories')}
          style={{ fontWeight: tab === 'categories' ? 'bold' : 'normal',
                   padding: '0.4rem 1rem', cursor: 'pointer' }}
        >
          Categories
        </button>
        <button
          onClick={() => setTab('orders')}
          style={{ fontWeight: tab === 'orders' ? 'bold' : 'normal',
                   padding: '0.4rem 1rem', cursor: 'pointer' }}
        >
          Orders
        </button>
      </div>

      {tab === 'products'   && <ProductManager />}
      {tab === 'categories' && <CategoryManager />}
      {tab === 'orders'     && <OrderManager />}
    </main>
  );
}
