import React, { useContext, useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AuthContext } from '../App';
import useCsrfToken from '../hooks/use-csrf-token';

const API = '';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { auth, changePassword } = useContext(AuthContext);
  const { csrfToken, csrfError, refreshCsrfToken } = useCsrfToken();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('password');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  if (!auth.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Fetch orders when orders tab is opened
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0 && !ordersLoading) {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');

    try {
      const res = await fetch(`${API}/api/orders/recent?limit=5`, {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const data = await res.json();
        setOrdersError(data.error || 'Failed to fetch orders');
        setOrdersLoading(false);
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setOrdersError(err.message || 'An error occurred');
    } finally {
      setOrdersLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('New passwords do not match');
      return;
    }

    const latestToken = (await refreshCsrfToken()) || csrfToken;
    if (!latestToken) {
      setError(csrfError || 'CSRF token unavailable. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      newPasswordConfirm,
      csrfToken: latestToken,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Change password failed');
      return;
    }

    setMessage(result.message || 'Password changed successfully. Please login again.');
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    navigate('/login', { replace: true });
  };

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>My Account</h1>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid #666', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            fontWeight: activeTab === 'password' ? 'bold' : 'normal',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'password' ? '2px solid #007bff' : 'none',
          }}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            fontWeight: activeTab === 'orders' ? 'bold' : 'normal',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'orders' ? '2px solid #007bff' : 'none',
          }}
        >
          Order History
        </button>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div style={{ maxWidth: '520px' }}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {message && <p style={{ color: '#90ee90' }}>{message}</p>}
          {csrfError && <p style={{ color: 'red' }}>{csrfError}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
            <input type="hidden" name="csrf_token" value={csrfToken} readOnly />

            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                required
                style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
              />
            </label>

            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                required
                style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
              />
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                minLength={8}
                maxLength={128}
                required
                style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
              />
            </label>

            <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Recent Orders (Last 5)</h2>

          {ordersError && (
            <div
              style={{
                backgroundColor: '#fee',
                color: '#c00',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              {ordersError}
            </div>
          )}

          {ordersLoading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>You haven't placed any orders yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#444', borderBottom: '2px solid #666' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Order ID</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <React.Fragment key={order.order_id}>
                      <tr style={{ borderBottom: '1px solid #666' }}>
                        <td style={{ padding: '0.75rem' }}>#{order.order_id}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          ${Number(order.total_amount).toFixed(2)} {order.currency}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor:
                                order.status === 'paid'
                                  ? '#28a745'
                                  : order.status === 'pending'
                                    ? '#ffc107'
                                    : '#dc3545',
                              color: 'white',
                              fontSize: '0.85rem',
                            }}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{formatDate(order.created_at)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.order_id ? null : order.order_id
                              )
                            }
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            {expandedOrderId === order.order_id ? 'Hide' : `Show (${order.items.length})`}
                          </button>
                        </td>
                      </tr>
                      {expandedOrderId === order.order_id && (
                        <tr style={{ backgroundColor: '#333', borderBottom: '2px solid #666' }}>
                          <td colSpan="5" style={{ padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #666' }}>
                                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Product</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Quantity</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #555' }}>
                                    <td style={{ padding: '0.5rem' }}>{item.name}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                      {item.quantity}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                      ${Number(item.price_at_purchase).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                      $
                                      {Number(
                                        item.price_at_purchase * item.quantity
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: '1rem' }}>
        <Link to="/">Back to home</Link>
      </p>
    </main>
  );
}
