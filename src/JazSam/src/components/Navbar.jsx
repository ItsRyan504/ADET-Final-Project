import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

/* ── Logout confirmation modal ── */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="logout-overlay" onClick={onCancel}>
      <div className="logout-modal" onClick={e => e.stopPropagation()}>
        <p className="logout-modal__title">Log out?</p>
        <p className="logout-modal__sub">Are you sure you want to log out of your account?</p>
        <div className="logout-modal__actions">
          <button className="logout-modal__btn logout-modal__btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="logout-modal__btn logout-modal__btn--confirm" onClick={onConfirm}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [showLogoutDlg, setShowLogoutDlg] = useState(false);
  const { user, logout }                  = useAuth();
  const navigate                          = useNavigate();
  const location                          = useLocation();

  const isTransparent = !scrolled && location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Guest links ── */
  const guestLinks = [
    { to: '/',         label: 'Home'     },
    { to: '/menu',     label: 'Menu'     },
    { to: '/about',    label: 'About'    },
    { to: '/rewards',  label: 'Rewards'  },
    { to: '/location', label: 'Location' },
  ];

  /* ── Logged-in links ── */
  const userLinks = [
    { to: '/',           label: 'Home'      },
    { to: '/menu',       label: 'Menu'      },
    { to: '/about',      label: 'About'     },
    { to: '/rewards',    label: 'Rewards'   },
    { to: '/my-orders',  label: 'My orders' },
    { to: '/profile',    label: 'Profile'   },
  ];

  const links = user ? userLinks : guestLinks;

  function confirmLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
    setShowLogoutDlg(false);
  }

  return (
    <>
      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}${isTransparent ? ' navbar--transparent' : ''}`}>
        <div className="container navbar__inner">

          {/* Logo */}
          <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
            <div className="navbar__logo-icon">
              <img src="/trademark.png" alt="Jazsam" className="navbar__trademark-img" />
            </div>
            <span>Jazsam</span>
          </Link>

          {/* spacer */}
          <div className="navbar__spacer" />

          {/* Desktop Nav */}
          <nav className="navbar__links" aria-label="Main navigation">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
                end={to === '/'}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Auth area */}
          <div className="navbar__auth">
            {user ? (
              <button className="navbar__login-link navbar__logout-btn" onClick={() => setShowLogoutDlg(true)}>
                Log out
              </button>
            ) : (
              <Link to="/login" className="navbar__login-link">Login/Sign up</Link>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`navbar__hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="navbar__drawer">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `navbar__drawer-link${isActive ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
                end={to === '/'}
              >
                {label}
              </NavLink>
            ))}
            <div className="navbar__drawer-auth">
              {user ? (
                <button className="navbar__login-link navbar__logout-btn" onClick={() => { setMenuOpen(false); setShowLogoutDlg(true); }}>Log out</button>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}>Login / Sign up</Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Logout confirmation modal — rendered outside header so z-index stacks above everything */}
      {showLogoutDlg && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutDlg(false)}
        />
      )}
    </>
  );
}
