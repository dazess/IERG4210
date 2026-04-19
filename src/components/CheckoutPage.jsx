import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext, AuthContext } from '../App';
import useCsrfToken from '../hooks/use-csrf-token';
import { sanitizeDisplayText } from '../lib/validation';

const API = '';
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { auth, reloadAuth } = useContext(AuthContext);
  const { cart, removeFromCart } = useContext(CartContext);
  const { csrfToken, csrfError, refreshCsrfToken } = useCsrfToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const items = Object.values(cart);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!auth.loading && !auth.authenticated) {
      navigate('/login', { replace: true });
    }
  }, [auth.authenticated, auth.loading, navigate]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const latestToken = (await refreshCsrfToken()) || csrfToken;
      if (!latestToken) {
        setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
        setLoading(false);
        return;
      }

      // Prepare order items (pid and quantity only, as per requirements)
      const orderItems = items.map(item => ({
        pid: item.pid,
        quantity: item.qty,
      }));

      // Call backend to create checkout session
      const res = await fetch(`${API}/api/checkout/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': latestToken,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ items: orderItems, csrf_token: latestToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          await reloadAuth();
          navigate('/login', { replace: true });
          return;
        }
        setError(data.error || 'Failed to create checkout session');
        setLoading(false);
        return;
      }

      // Redirect to Stripe checkout
      const stripe = window.Stripe(STRIPE_PUBLIC_KEY);
      if (!stripe) {
        setError('Failed to load Stripe');
        setLoading(false);
        return;
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (auth.loading) {
    return <main style={{ padding: '2rem', color: 'white' }}>Loading...</main>;
  }

  if (!auth.authenticated) {
    return <main style={{ padding: '2rem', color: 'white' }}>Redirecting to login...</main>;
  }

  return (
    <main className="checkout-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <h1 style={{ color: 'white' }}>Checkout</h1>

      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ color: 'white' }}>
          <p>Your cart is empty.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div style={{ color: 'white' }}>
          <h2 style={{ color: 'white' }}>Order Summary</h2>
          <div style={{ marginBottom: '2rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1rem',
                color: 'white',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #555' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Product</th>
                  <th style={{ textAlign: 'center', padding: '0.5rem' }}>Quantity</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.pid} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ padding: '0.5rem' }}>
                      {sanitizeDisplayText(item.name, 255)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.5rem' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      ${Number(item.price).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      ${Number(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                textAlign: 'right',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                padding: '1rem 0',
                borderTop: '2px solid #555',
                color: 'white',
              }}
            >
              Total: ${Number(total).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              disabled={loading}
            >
              Continue Shopping
            </button>

            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
