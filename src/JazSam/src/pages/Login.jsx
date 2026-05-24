import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

/* ─── Password visibility icon ─────────────── */
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

/* ─── Check icon ────────────────────────────── */
function CheckIcon() { return <span>✓</span>; }

/* ─── Password rules ────────────────────────── */
const PW_RULES = [
  { id: 'len',     label: 'At least 12 characters',                         test: (p) => p.length >= 12 },
  { id: 'upper',   label: 'Includes at least one uppercase letter (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'Includes at least one number (0-9)',             test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Must contain one special character (! @ # $ %)', test: (p) => /[!@#$%]/.test(p) },
];

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function Login() {
  const [view, setView] = useState('login');
  const navigate        = useNavigate();
  const { login, register } = useAuth();

  /* ── Shared loading state ── */
  const [loading, setLoading] = useState(false);

  /* ── Login state ── */
  const [loginEmail,  setLoginEmail]  = useState('');
  const [loginPw,     setLoginPw]     = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginErr,    setLoginErr]    = useState({});

  /* ── Forgot password state ── */
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotErr,     setForgotErr]     = useState('');
  const [forgotSent,    setForgotSent]    = useState(false);

  /* ── Register step 1 state ── */
  const [reg1,    setReg1]    = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [reg1Err, setReg1Err] = useState({});

  /* ── Register step 2 state ── */
  const [password,    setPassword]    = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reg2Err,     setReg2Err]     = useState({});

  /* ── Handlers ── */
  async function handleLogin(e) {
    e.preventDefault();
    const errs = {};
    if (!loginEmail.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errs.email = 'Please enter a valid email address';
    if (!loginPw) errs.pw = 'Password is required';
    if (Object.keys(errs).length) { setLoginErr(errs); return; }

    setLoading(true);
    const result = await login({ email: loginEmail, password: loginPw });
    setLoading(false);

    if (!result.success) {
      setLoginErr({ general: result.error });
      return;
    }

    setLoginErr({});
    navigate('/');
  }

  function handleForgotSend(e) {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotErr('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) { setForgotErr('Please enter a valid email address.'); return; }
    setForgotErr('');
    setForgotSent(true);
  }

  function handleReg1Next(e) {
    e.preventDefault();
    const errs = {};
    if (!reg1.firstName.trim()) errs.firstName = 'First name is required';
    if (!reg1.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!reg1.email.trim())     errs.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(reg1.email)) errs.email = 'Please enter a valid email address';
    if (reg1.phone && !/^[0-9+\-() ]{7,15}$/.test(reg1.phone)) errs.phone = 'Please enter a valid contact number';
    if (Object.keys(errs).length) { setReg1Err(errs); return; }
    setReg1Err({});
    setView('register-step2');
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    const errs = {};
    const allPass = PW_RULES.every(r => r.test(password));
    if (!allPass)               errs.pw      = 'Password does not meet all requirements';
    if (password !== confirmPw) errs.confirm = 'Password does not match!';
    if (Object.keys(errs).length) { setReg2Err(errs); return; }

    setLoading(true);
    const result = await register({
      firstName: reg1.firstName,
      lastName:  reg1.lastName,
      email:     reg1.email,
      phone:     reg1.phone,
      password,
    });
    setLoading(false);

    if (!result.success) {
      setReg2Err({ general: result.error });
      return;
    }

    setReg2Err({});
    navigate('/');
  }

  /* ════════════
     LOGIN VIEW
     ════════════ */
  if (view === 'login') {
    return (
      <div className="login-page">
        <div className="login-card">
          <img src="/login-icon.png" alt="JazSam" className="login-icon" />
          <h1 className="login-title">Log in to Jazsam Coffee</h1>

          {loginErr.general && (
            <div className="login-error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{loginErr.general}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin} noValidate>

            {/* Email */}
            <div className={`login-field floating${loginErr.email ? ' has-error' : ''}`}>
              <input
                id="login-email"
                type="email"
                placeholder=" "
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                autoComplete="email"
              />
              <label htmlFor="login-email">Email address</label>
              {loginErr.email && <p className="field-error">{loginErr.email}</p>}
            </div>

            {/* Password */}
            <div className={`login-field floating${loginErr.pw ? ' has-error' : ''}`}>
              <div className="pw-wrapper">
                <input
                  id="login-password"
                  type={showLoginPw ? 'text' : 'password'}
                  placeholder=" "
                  value={loginPw}
                  onChange={e => setLoginPw(e.target.value)}
                  autoComplete="current-password"
                />
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowLoginPw(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  <EyeIcon open={showLoginPw} />
                </button>
              </div>
              {loginErr.pw && <p className="field-error">{loginErr.pw}</p>}
            </div>

            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="login-forgot">
            <button type="button" className="login-forgot-btn" onClick={() => { setView('forgot'); setForgotEmail(''); setForgotSent(false); setForgotErr(''); }}>
              Forgotten password?
            </button>
          </p>

          <div className="login-divider"><span>Not a member yet?</span></div>

          <button
            type="button"
            className="login-btn-outline"
            onClick={() => { setView('register-step1'); setLoginErr({}); }}
          >
            Create an account
          </button>

          <span className="login-back-link" onClick={() => navigate('/')}>
            ← Back to Home
          </span>

          <button
            type="button"
            className="login-btn-admin"
            onClick={() => navigate('/admin')}
          >
            Staff Login
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════
     FORGOT PASSWORD
     ══════════════════ */
  if (view === 'forgot') {
    return (
      <div className="login-page">
        <div className="login-card">
          <img src="/login-icon.png" alt="JazSam" className="login-icon" />

          {forgotSent ? (
            <>
              <h1 className="login-title">Email sent!</h1>
              <p className="login-subtitle">Check your emails for recovery instructions.</p>

              <div className="forgot-success__icon" style={{ margin: '8px 0 20px' }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                  <circle cx="17" cy="17" r="5" fill="#22c55e" stroke="none"/>
                  <polyline points="14.5 17 16.5 19 19.5 15.5" stroke="#fff" strokeWidth="2"/>
                </svg>
              </div>

              <button type="button" className="login-btn-primary" style={{ width: '100%' }} onClick={() => setView('login')}>
                Proceed to Login
              </button>

              <span className="login-back-link" onClick={() => setView('login')}>
                ← Back to Login
              </span>
            </>
          ) : (
            <>
              <h1 className="login-title">Account recovery</h1>
              <p className="login-subtitle">Enter your email for recovery instructions.</p>

              <form className="login-form" onSubmit={handleForgotSend} noValidate>
                <div className={`login-field floating${forgotErr ? ' has-error' : ''}`}>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder=" "
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <label htmlFor="forgot-email">Email address</label>
                  {forgotErr && <p className="field-error">{forgotErr}</p>}
                </div>

                <button type="submit" className="login-btn-primary">Continue</button>
              </form>

              <span className="login-back-link" onClick={() => setView('login')}>
                ← Back to Login
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════
     REGISTER STEP 1
     ══════════════════ */
  if (view === 'register-step1') {
    return (
      <div className="login-page">
        <div className="login-card">
          <img src="/login-icon.png" alt="JazSam" className="login-icon" />
          <h1 className="login-title">Create an account</h1>

          <form className="login-form" onSubmit={handleReg1Next} noValidate>

            <div className={`login-field floating${reg1Err.firstName ? ' has-error' : ''}`}>
              <input
                id="reg-firstname"
                type="text"
                placeholder=" "
                value={reg1.firstName}
                onChange={e => setReg1({ ...reg1, firstName: e.target.value })}
                autoComplete="given-name"
              />
              <label htmlFor="reg-firstname">First name</label>
              {reg1Err.firstName && <p className="field-error">{reg1Err.firstName}</p>}
            </div>

            <div className={`login-field floating${reg1Err.lastName ? ' has-error' : ''}`}>
              <input
                id="reg-lastname"
                type="text"
                placeholder=" "
                value={reg1.lastName}
                onChange={e => setReg1({ ...reg1, lastName: e.target.value })}
                autoComplete="family-name"
              />
              <label htmlFor="reg-lastname">Last name</label>
              {reg1Err.lastName && <p className="field-error">{reg1Err.lastName}</p>}
            </div>

            <div className={`login-field floating${reg1Err.email ? ' has-error' : ''}`}>
              <input
                id="reg-email"
                type="email"
                placeholder=" "
                value={reg1.email}
                onChange={e => setReg1({ ...reg1, email: e.target.value })}
                autoComplete="email"
              />
              <label htmlFor="reg-email">Email address</label>
              {reg1Err.email && <p className="field-error">{reg1Err.email}</p>}
            </div>

            <div className={`login-field floating${reg1Err.phone ? ' has-error' : ''}`}>
              <input
                id="reg-phone"
                type="tel"
                placeholder=" "
                value={reg1.phone}
                onChange={e => setReg1({ ...reg1, phone: e.target.value })}
                autoComplete="tel"
              />
              <label htmlFor="reg-phone">Contact number (optional)</label>
              {reg1Err.phone && <p className="field-error">{reg1Err.phone}</p>}
            </div>

            <button type="submit" className="login-btn-primary">Next</button>
          </form>

          <span className="login-back-link" onClick={() => setView('login')}>
            ← Already have an account
          </span>
        </div>
      </div>
    );
  }

  /* ══════════════════
     REGISTER STEP 2
     ══════════════════ */
  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/login-icon.png" alt="JazSam" className="login-icon" />
        <h1 className="login-title">Create an account</h1>

        {reg2Err.general && (
          <div className="login-error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{reg2Err.general}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleCreateAccount} noValidate>

          <div className={`login-field floating${reg2Err.pw ? ' has-error' : ''}`}>
            <div className="pw-wrapper">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <label htmlFor="reg-password">Enter your password</label>
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label="Toggle password visibility"
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          <ul className="pw-checklist">
            {PW_RULES.map(rule => {
              const valid = rule.test(password);
              return (
                <li key={rule.id} className={valid ? 'valid' : ''}>
                  <span className="check-icon">{valid ? <CheckIcon /> : ''}</span>
                  {rule.label}
                </li>
              );
            })}
          </ul>

          <div className={`login-field floating${reg2Err.confirm ? ' has-error' : ''}`}>
            <div className="pw-wrapper">
              <input
                id="reg-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder=" "
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
              <label htmlFor="reg-confirm-password">Re-enter your password</label>
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowConfirm(v => !v)}
                aria-label="Toggle confirm password visibility"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {reg2Err.confirm && <p className="field-error">{reg2Err.confirm}</p>}
          </div>

          <p className="login-privacy">
            Sign up to accept <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
          </p>

          <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
        </form>

        <span className="login-back-link" onClick={() => setView('register-step1')}>
          ← Return
        </span>
      </div>
    </div>
  );
}
