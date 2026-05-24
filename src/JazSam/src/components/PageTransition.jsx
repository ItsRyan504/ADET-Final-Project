import { useLocation } from 'react-router-dom';
import './PageTransition.css';

/**
 * Wraps page content in a slide-up + fade-in animation.
 * The `key` on the div re-triggers the CSS animation on every route change.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
