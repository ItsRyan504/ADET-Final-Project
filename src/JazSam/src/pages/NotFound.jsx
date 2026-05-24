import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="nf-page">
      {/* Floating coffee beans decoration */}
      <div className="nf-beans">
        <span className="nf-bean nf-bean--1">☕</span>
        <span className="nf-bean nf-bean--2">✦</span>
        <span className="nf-bean nf-bean--3">☕</span>
        <span className="nf-bean nf-bean--4">✦</span>
        <span className="nf-bean nf-bean--5">☕</span>
      </div>

      <div className="nf-card">
        {/* Coffee cup SVG illustration */}
        <div className="nf-cup-wrap">
          {/* Steam lines */}
          <div className="nf-steam">
            <span className="nf-steam-line nf-steam-line--1" />
            <span className="nf-steam-line nf-steam-line--2" />
            <span className="nf-steam-line nf-steam-line--3" />
          </div>

          <svg className="nf-cup" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Saucer */}
            <ellipse cx="60" cy="90" rx="46" ry="8" fill="#c8a882" />
            <ellipse cx="60" cy="88" rx="44" ry="6" fill="#d4b896" />
            {/* Cup body */}
            <path d="M22 44 Q20 90 60 90 Q100 90 98 44 Z" fill="#6b4226" />
            <path d="M22 44 Q20 88 60 88 Q100 88 98 44 Z" fill="#7a4f2e" />
            {/* Cup rim */}
            <ellipse cx="60" cy="44" rx="38" ry="8" fill="#8b5e3c" />
            <ellipse cx="60" cy="43" rx="36" ry="6" fill="#c8a882" />
            {/* Coffee surface */}
            <ellipse cx="60" cy="43" rx="34" ry="5" fill="#3d1f0a" />
            {/* Latte art heart */}
            <path d="M60 47 Q56 43 52 45 Q48 47 52 52 Q56 57 60 60 Q64 57 68 52 Q72 47 68 45 Q64 43 60 47Z"
              fill="#c8a882" opacity="0.35" />
            {/* Handle */}
            <path d="M98 50 Q116 50 116 64 Q116 78 98 78" stroke="#6b4226" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M98 52 Q112 52 112 64 Q112 76 98 76" stroke="#8b5e3c" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>

          {/* Spill */}
          <svg className="nf-spill" viewBox="0 0 160 30" fill="none">
            <ellipse cx="80" cy="15" rx="70" ry="12" fill="#3d1f0a" opacity="0.18" />
            <ellipse cx="55" cy="20" rx="20" ry="7" fill="#3d1f0a" opacity="0.12" />
            <ellipse cx="110" cy="19" rx="15" ry="6" fill="#3d1f0a" opacity="0.1" />
          </svg>
        </div>

        {/* 404 number */}
        <div className="nf-code">
          <span className="nf-code-digit">4</span>
          <span className="nf-code-ring">0</span>
          <span className="nf-code-digit">4</span>
        </div>

        <h1 className="nf-title">Oops! Page not found.</h1>
        <p className="nf-desc">
          Looks like this page has been brewed away. It may have moved,<br />
          been removed, or never existed in the first place.
        </p>

        <div className="nf-actions">
          <button className="nf-btn nf-btn--primary" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Back to Home
          </button>
          <button className="nf-btn nf-btn--outline" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>

        <p className="nf-hint">Error 404 · Page not found</p>
      </div>
    </div>
  );
}
