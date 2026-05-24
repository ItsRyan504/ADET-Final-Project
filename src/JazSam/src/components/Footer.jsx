import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__brand-name">
            <div className="footer__logo-icon">
              <img src="/trademark.png" alt="Jazsam" className="footer__trademark-img" />
            </div>
            <span>Jazsam Coffee</span>
          </div>
          <p className="footer__tagline">Where every sip tells a tale.</p>
        </div>

        {/* Privacy */}
        <div className="footer__col">
          <h4 className="footer__col-heading">PRIVACY</h4>
          <ul className="footer__col-links">
            <li><Link to="#">Terms of use</Link></li>
            <li><Link to="#">Privacy policy</Link></li>
            <li><Link to="#">Cookies</Link></li>
          </ul>
        </div>

        {/* Explore */}
        <div className="footer__col">
          <h4 className="footer__col-heading">EXPLORE</h4>
          <ul className="footer__col-links">
            <li><Link to="/menu">Our menu</Link></li>
            <li><Link to="/location">Find our location</Link></li>
            <li><Link to="/menu">Place an order</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer__col">
          <h4 className="footer__col-heading">COMPANY</h4>
          <ul className="footer__col-links">
            <li><Link to="/about">About us</Link></li>
            <li><Link to="#">Careers</Link></li>
          </ul>
        </div>

        {/* Get In Touch */}
        <div className="footer__col">
          <h4 className="footer__col-heading">GET IN TOUCH</h4>

          {/* Social icons */}
          <div className="footer__socials">
            <a href="https://www.facebook.com/profile.php?id=100089723943955" target="_blank" rel="noopener noreferrer" className="footer__social-icon" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="footer__social-icon" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.97a8.16 8.16 0 004.77 1.52V7.04a4.85 4.85 0 01-1-.35z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__social-icon" aria-label="Twitter/X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* Contact items */}
          <div className="footer__contact-list">
            <div className="footer__contact-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>jazsamcoffee@gmail.com</span>
            </div>
            <div className="footer__contact-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>+639876543210</span>
            </div>
          </div>
        </div>

      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© 2026 Jazsam Coffee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
