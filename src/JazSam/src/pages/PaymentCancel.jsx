import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API = 'http://localhost/salespresso-api';

export default function PaymentCancel() {
  const [params] = useSearchParams();
  const orderId = params.get('order');

  useEffect(() => {
    if (!orderId) return;
    fetch(`${API}/order-cancel.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: orderId }),
    }).catch(() => {});
  }, [orderId]);

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>❌</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Payment cancelled</h1>
        {orderId && (
          <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
            Order <strong>#{orderId}</strong> was not paid.
          </p>
        )}
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          No charge was made. You can try again or pay at the counter when you pick up your order.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/my-orders"
            style={{
              background: '#1a1a1a', color: '#fff', padding: '0.65rem 1.5rem',
              borderRadius: 8, textDecoration: 'none', fontWeight: 600,
            }}
          >
            View my orders
          </Link>
          <Link
            to="/menu"
            style={{
              background: '#f5f0ea', color: '#1a1a1a', padding: '0.65rem 1.5rem',
              borderRadius: 8, textDecoration: 'none', fontWeight: 600,
            }}
          >
            Back to menu
          </Link>
        </div>
      </div>
    </main>
  );
}
