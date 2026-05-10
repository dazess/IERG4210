import React, { useState, useEffect } from 'react';

const API = '';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/orders/recent`, {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to fetch orders');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <main style={{ padding: '2rem', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>My Orders</h1>

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

      {loading ? (
        <p>Loading your orders...</p>
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
    </main>
  );
}
