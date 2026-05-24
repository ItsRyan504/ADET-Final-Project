import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const API_AUTH          = 'http://localhost/salespresso-api/auth.php';
const ADMIN_SESSION_KEY = 'jazsam_admin';

export function getAdminSession() {
  try { return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY)); }
  catch { return null; }
}

export function getAdminToken() {
  return getAdminSession()?.token ?? null;
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!pw)           { setError('Password is required.'); return; }

    setLoading(true);
    try {
      const res  = await fetch(API_AUTH, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password: pw }),
      });
      const data = await res.json();

      if (data.success) {
        const session = {
          token:          data.token,
          role:           (data.role || 'Admin').toLowerCase(),
          name:           data.name  || 'Admin',
          email:          data.email || email,
          profilePicture: data.profilePicture || null,
          loginAt:        new Date().toISOString(),
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(data.error || 'Invalid admin credentials. Please try again.');
        setLoading(false);
      }
    } catch {
      /* API unreachable — let user know */
      setError('Cannot connect to the server. Make sure XAMPP is running.');
      setLoading(false);
    }
  }

  return (
    <div className="al-page">
      {/* ── Left branding panel ── */}
      <div className="al-left">
        <div className="al-left-brand">
          <img src="/login-icon.png" alt="JazSam" className="al-left-logo" />
          <span className="al-left-brand-name">Salespresso</span>
        </div>

        <div className="al-left-tagline">
          <h2 className="al-left-title">Jazsam{'\n'}Admin Portal</h2>
          <p className="al-left-sub">
            Manage products, inventory, orders, and staff all in one place.
          </p>
        </div>

        <div className="al-left-badge">
          <span className="al-left-badge-dot" />
          Restricted Access
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="al-right">
        <div className="al-card">
          {/* Logo + brand */}
          <div className="al-brand">
            <img src="/login-icon.png" alt="JazSam" className="al-logo" />
            <div className="al-brand-text">
              <span className="al-brand-name">JazSam</span>
              <span className="al-brand-sub">Admin Portal</span>
            </div>
          </div>

          <h1 className="al-title">Welcome back, Admin</h1>
          <p className="al-desc">Sign in to access the management dashboard.</p>

          {error && (
            <div className="al-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form className="al-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="al-field">
              <label htmlFor="al-email">Admin Email</label>
              <div className="al-input-wrap">
                <svg className="al-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="al-email"
                  type="email"
                  placeholder="admin@jazsam.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="al-field">
              <label htmlFor="al-password">Password</label>
              <div className="al-input-wrap">
                <svg className="al-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="al-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="al-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label="Toggle password"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            <button type="submit" className="al-submit" disabled={loading}>
              {loading ? (
                <span className="al-spinner" />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign in to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="al-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            This portal is restricted to authorized JazSam administrators only.
          </div>

          <button className="al-back" onClick={() => navigate('/')}>
            ← Back to Customer Site
          </button>
        </div>
      </div>
    </div>
  );
}
