import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CartContext, AuthContext } from '../App';

const API = '';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { auth } = useContext(AuthContext);
  useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);

  const sessionId = searchParams.get('session_id');

  // Fetch order details and clear cart on mount
  useEffect(() => {
    if (!auth.authenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Clear cart from localStorage
    const cartKey = `cart:user:${auth.user?.userid}`;
    if (cartKey) {
      localStorage.removeItem(cartKey);
    }

    const verifySession = async () => {
      if (!sessionId) {
        setError('Missing checkout session id');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/api/checkout/verify-session?session_id=${encodeURIComponent(sessionId)}`, {
          method: 'GET',
          credentials: 'same-origin',
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Unable to verify payment status');
        } else {
          setStatus(data.status || 'pending');
        }
      } catch (err) {
        setError(err.message || 'Unable to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [auth, navigate]);

  // Auto-redirect after countdown
  useEffect(() => {
    if (!loading && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      navigate('/', { replace: true });
    }
  }, [countdown, loading, navigate]);

  if (loading) {
    return <main style={{ padding: '2rem', color: 'white' }}>Processing...</main>;
  }

  return (
    <main
      className="checkout-success-page"
      style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '3rem 2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #c3e6cb',
        }}
      >
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>✓ Payment Successful!</h1>
        <p style={{ margin: '0.5rem 0', fontSize: '1.25rem' }}>
          Thank you for your purchase. Your order has been confirmed.
        </p>
        {error && (
          <p style={{ margin: '0.75rem 0', color: '#8a1f11', fontWeight: 600 }}>
            {error}
          </p>
        )}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #c3e6cb' }}>
          <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>Status: {String(status).toUpperCase()}</p>
          {sessionId && (
            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
              Session ID: <code style={{ wordBreak: 'break-all' }}>{sessionId}</code>
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '2rem', color: 'white' }}>
        <p>You will be redirected to the homepage in {countdown} seconds...</p>
        <p>You can view your order history in your account page</p>
      </div>

      <button
        onClick={() => navigate('/', { replace: true })}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Return to Shop
      </button>

    </main>
  );
}
