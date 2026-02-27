import React, { useState, useEffect, createContext } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';
import Admin from './components/Admin';
import Footer from './components/Footer';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import '../styles/main.css';

export const CartContext = createContext(null);

const API = '';

function App() {
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
    const amount = Math.max(1, parseInt(qty) || 1);
    setCart(prev => {
      const existing = prev[product.pid];
      return {
        ...prev,
        [product.pid]: {
          pid:   product.pid,
          name:  product.name,
          price: product.price,
          qty:   existing ? existing.qty + amount : amount,
        },
      };
    });
  }

  function updateQty(pid, qty) {
    const next = Math.max(1, parseInt(qty) || 1);
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

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart }}>
      <Router>
        <Header />
        <Routes>
          <Route path="/"             element={<HomePage />} />
          <Route path="/product/:pid" element={<ProductPage />} />
          <Route path="/admin"        element={<Admin />} />
        </Routes>
        <Footer />
      </Router>
    </CartContext.Provider>
  );
}

export default App;
