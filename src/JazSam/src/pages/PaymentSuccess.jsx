import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API = 'http://localhost/salespresso-api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('order');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'paid' | 'pending' | 'error'

  useEffect(() => {
    if (!orderId) { setStatus('error'); return; }

    fetch(`${API}/paymongo-verify.php?order=${orderId}`)
      .then(r => r.json())
      .then(data => setStatus(data.paid ? 'paid' : 'pending'))
      .catch(() => setStatus('error'));
  }, [orderId]);

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>

        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Confirming payment…</h1>
            <p style={{ color: '#6b7280' }}>Please wait while we verify your payment.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#22c55e" />
                <path d="M7.5 12.5l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Payment confirmed!</h1>
            {orderId && (
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                Order <strong>#{orderId}</strong> has been paid.
              </p>
            )}
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              We&apos;re preparing your order. You can track its status below.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-orders" style={btnPrimary}>View my orders</Link>
              <Link to="/menu"      style={btnSecondary}>Order more</Link>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🕐</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Payment pending</h1>
            {orderId && (
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                Order <strong>#{orderId}</strong>
              </p>
            )}
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Your payment hasn&apos;t been confirmed yet. You can check your order status — it may update in a moment.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-orders" style={btnPrimary}>View my orders</Link>
              <Link to="/menu"      style={btnSecondary}>Back to menu</Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              We couldn&apos;t verify your payment. Please check your orders or contact us.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-orders" style={btnPrimary}>View my orders</Link>
              <Link to="/menu"      style={btnSecondary}>Back to menu</Link>
            </div>
          </>
        )}

      </div>
    </main>
  );
}

const btnPrimary = {
  background: '#1a1a1a', color: '#fff', padding: '0.65rem 1.5rem',
  borderRadius: 8, textDecoration: 'none', fontWeight: 600,
};
const btnSecondary = {
  background: '#f5f0ea', color: '#1a1a1a', padding: '0.65rem 1.5rem',
  borderRadius: 8, textDecoration: 'none', fontWeight: 600,
};
